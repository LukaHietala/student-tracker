package api

import (
	"context"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
	"github.com/grandcat/zeroconf"
	"github.com/lukahietala/rfid/db"
	"github.com/lukahietala/rfid/websockets"
)

const service = "_rfid_reader._tcp"

const (
	ackOK     = 0x01
	ackFailed = 0xFF
)

type devicesResource struct{}

func (rs devicesResource) Routes() chi.Router {
	r := chi.NewRouter()

	r.Get("/", rs.List)
	r.Get("/scan", rs.Scan)
	r.Post("/pair", rs.Pair)
	r.Route("/{id}", func(r chi.Router) {
		r.Use(rs.DeviceCtx)
		r.Get("/", rs.FindOne)
		r.Put("/", rs.Update)
		r.Delete("/", rs.Delete)
	})

	return r
}

func (rs devicesResource) DeviceCtx(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var dev *db.Device
		var err error

		deviceIDStr := chi.URLParam(r, "id")
		if deviceIDStr == "" {
			render.Render(w, r, ErrNotFound())
			return
		}

		deviceID, err := strconv.Atoi(deviceIDStr)
		if err != nil {
			render.Render(w, r, ErrInternal(err))
			return
		}

		dev, err = store.FindDeviceByID(r.Context(), deviceID)
		if err != nil {
			render.Render(w, r, ErrNotFound())
			return
		}

		ctx := context.WithValue(r.Context(), "device", dev)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (rs devicesResource) List(w http.ResponseWriter, r *http.Request) {
	devices, err := store.ListDevices(r.Context())
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	render.JSON(w, r, devices)
}

func (rs devicesResource) FindOne(w http.ResponseWriter, r *http.Request) {
	dev := r.Context().Value("device").(*db.Device)
	render.JSON(w, r, dev)
}

func (rs devicesResource) Update(w http.ResponseWriter, r *http.Request) {
	dev := r.Context().Value("device").(*db.Device)

	var req db.Device
	if err := render.Decode(r, &req); err != nil {
		render.Render(w, r, ErrInvalidRequest(errors.New("invalid json payload")))
		return
	}

	if err := dev.Validate(); err != nil {
		render.Render(w, r, ErrInvalidRequest(err))
		return
	}

	dev = &req
	if err := store.UpdateDevice(r.Context(), dev.ID, req); err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	bytes, err := json.Marshal(dev)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	hub.Broadcast(websockets.Event{
		Event:   "device:update",
		Payload: bytes,
	})

	render.Status(r, 200)
	render.JSON(w, r, dev)
}

func (rs devicesResource) Delete(w http.ResponseWriter, r *http.Request) {
	dev := r.Context().Value("device").(*db.Device)

	err := store.DeleteDeviceByID(r.Context(), dev.ID)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	bytes, err := json.Marshal(dev)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	hub.Broadcast(websockets.Event{
		Event:   "device:delete",
		Payload: bytes,
	})

	render.Status(r, 200)
	render.JSON(w, r, dev)
}

type DeviceResponse struct {
	Entry    *zeroconf.ServiceEntry `json:"entry"`
	IPv4Addr string                 `json:"ipv4_addr"`
	Paired   bool                   `json:"paired"`
}

func (rs devicesResource) Scan(w http.ResponseWriter, r *http.Request) {
	resolver, err := zeroconf.NewResolver(nil)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	// TODO: Figure out how to do with render
	w.Header().Set("Transfer-Encoding", "chunked")

	entries := make(chan *zeroconf.ServiceEntry)
	go func(results <-chan *zeroconf.ServiceEntry) {
		for entry := range results {
			dev := DeviceResponse{
				Entry:    entry,
				IPv4Addr: entry.AddrIPv4[0].To4().String(),
				// Device should not advertise itself if paired
				// TODO: Maybe check db still
				Paired: false,
			}
			render.JSON(w, r, dev)
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}
		}
	}(entries)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	//err = resolver.Browse(ctx, "_services._dns-sd._udp", "local.", entries)
	err = resolver.Browse(ctx, service, "local.", entries)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	<-ctx.Done()
}

type PairRequest struct {
	Name string `json:"name"` // zeroconf instance name
}

type PairResponse struct {
	ServerAddr string `json:"server_addr"`
	ReaderID   uint16 `json:"reader_id"`
	SecretKey  string `json:"secret_key"`
}

func (rs devicesResource) Pair(w http.ResponseWriter, r *http.Request) {
	var req PairRequest
	if err := render.Decode(r, &req); err != nil {
		render.Render(w, r, ErrInvalidRequest(errors.New("invalid json payload")))
		return
	}

	resolver, err := zeroconf.NewResolver(nil)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	var devEntry *zeroconf.ServiceEntry
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)

	defer cancel()
	entries := make(chan *zeroconf.ServiceEntry)
	go func(results <-chan *zeroconf.ServiceEntry) {
		devEntry = <-results
		cancel()
	}(entries)

	err = resolver.Lookup(ctx, req.Name, service, "local.", entries)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	<-ctx.Done()

	if devEntry == nil {
		render.Render(w, r, ErrInvalidRequest(errors.New("pairing failed, device not found")))
		return
	}

	txt := strings.Split(devEntry.Text[0], "=")
	// Just to be safe :)
	if len(txt) != 2 {
		render.Render(w, r, ErrInvalidRequest(errors.New("txt entry is invalid")))
		return
	}

	dev := db.Device{
		Name:     devEntry.ServiceRecord.Instance,
		MacAddr:  txt[1],
		IPv4Addr: devEntry.AddrIPv4[0].To4().String(),
		Online:   true,
	}

	if err := dev.Validate(); err != nil {
		render.Render(w, r, ErrInvalidRequest(err))
		return
	}

	if err := store.AddDevice(r.Context(), &dev); err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	pairRes := PairResponse{
		// TODO: Make general config for these
		ServerAddr: getOutboundIP() + ":5000",
		ReaderID:   uint16(dev.ID), // Technically breaks after 65,535. Not feeling paranoid enough to check
		SecretKey:  dev.SecretKey,
	}

	pairResBytes, err := json.Marshal(pairRes)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		deleteDevice(store, dev.ID)
		return
	}

	readerAddr := devEntry.AddrIPv4[0].To4().String() + ":" + strconv.Itoa(devEntry.Port)
	conn, err := net.DialTimeout("tcp", readerAddr, 2*time.Second)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		deleteDevice(store, dev.ID)
		return
	}

	buf := make([]byte, 2+len(pairResBytes))
	binary.BigEndian.PutUint16(buf[0:2], uint16(len(pairResBytes)))
	copy(buf[2:], pairResBytes)

	conn.Write(buf)

	var ack [1]byte
	if _, err := io.ReadFull(conn, ack[:]); err != nil {
		render.Render(w, r, ErrInternal(err))
		deleteDevice(store, dev.ID)
		return
	}

	switch ack[0] {
	case ackOK:
	case ackFailed:
		render.Render(w, r, ErrInternal(errors.New("reader denied pairing")))
		deleteDevice(store, dev.ID)
		return
	default:
		render.Render(w, r, ErrInternal(fmt.Errorf("reader sent some trash: 0x%x", ack[0])))
		deleteDevice(store, dev.ID)
		return
	}

	bytes, err := json.Marshal(dev)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	hub.Broadcast(websockets.Event{
		Event:   "device:paired",
		Payload: bytes,
	})

	render.Status(r, http.StatusCreated)
	render.JSON(w, r, dev)
}

func deleteDevice(store *db.Store, id int) {
	deleteCtx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := store.DeleteDeviceByID(deleteCtx, id); err != nil {
		log.Println(err)
		// In deep trouble... Recover somehow
	}
}

func getOutboundIP() string {
	endpoints := []string{
		"1.1.1.1:80",
		"8.8.8.8:80",
		"168.235.104.38:80",
	}

	for _, endpoint := range endpoints {
		conn, err := net.DialTimeout("udp", endpoint, 2*time.Second)
		if err == nil {
			conn.Close()
			v, ok := conn.LocalAddr().(*net.UDPAddr)
			if !ok {
				return ""
			}

			return v.IP.String()
		}
	}

	return ""
}
