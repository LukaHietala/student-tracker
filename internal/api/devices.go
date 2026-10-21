package api

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
	"github.com/lukahietala/rfid/internal/auth"
	"github.com/lukahietala/rfid/internal/db"
)

type deviceResource struct {
	store *db.Store
	auth  *auth.Auth
}

func NewDeviceResource(s *db.Store, a *auth.Auth) *deviceResource {
	return &deviceResource{store: s, auth: a}
}

func (rs *deviceResource) Routes() chi.Router {
	r := chi.NewRouter()
	r.Use(rs.auth.Authenticator())

	r.Get("/", rs.List)
	r.Post("/", rs.Create)

	r.Route("/{deviceID}", func(r chi.Router) {
		r.Use(rs.DeviceCtx)
		r.Get("/", rs.FindOne)
		r.Put("/", rs.Update)
		r.Delete("/", rs.Delete)
	})

	return r
}

type DeviceRequest struct {
	Name string `json:"name"`
}

func (d *DeviceRequest) Bind(r *http.Request) error {
	d.Name = strings.TrimSpace(d.Name)

	if d.Name == "" {
		return errors.New("device name is required")
	}
	if utf8.RuneCountInString(d.Name) > 50 {
		return errors.New("device name is too long (max 50)")
	}

	return nil
}

type DeviceResponse struct {
	*db.Device
}

func NewDeviceResponse(dev *db.Device) *DeviceResponse {
	return &DeviceResponse{Device: dev}
}

func (d *DeviceResponse) Render(w http.ResponseWriter, r *http.Request) error {
	return nil
}

func NewDeviceListResponse(devices []*db.Device) []render.Renderer {
	list := []render.Renderer{}
	for _, dev := range devices {
		list = append(list, NewDeviceResponse(dev))
	}
	return list
}

func (rs *deviceResource) DeviceCtx(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		deviceIDStr := chi.URLParam(r, "deviceID")
		if deviceIDStr == "" {
			render.Render(w, r, ErrInvalidRequest(errors.New("device id is missing")))
			return
		}

		deviceID, err := strconv.Atoi(deviceIDStr)
		if err != nil {
			render.Render(w, r, ErrInvalidRequest(err))
			return
		}

		device, err := rs.store.FindDeviceByID(r.Context(), deviceID)
		if err != nil {
			render.Render(w, r, ErrNotFound())
			return
		}

		ctx := context.WithValue(r.Context(), deviceContextKey, device)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (rs *deviceResource) List(w http.ResponseWriter, r *http.Request) {
	devices, err := rs.store.ListDevices(r.Context())
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	render.RenderList(w, r, NewDeviceListResponse(devices))
}

func (rs *deviceResource) Create(w http.ResponseWriter, r *http.Request) {
	data := &DeviceRequest{}
	if err := render.Bind(r, data); err != nil {
		render.Render(w, r, ErrInvalidRequest(err))
		return
	}

	newDevice := &db.Device{
		Name: data.Name,
	}

	if err := rs.store.AddDevice(r.Context(), newDevice); err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	render.Status(r, http.StatusCreated)
	render.Render(w, r, NewDeviceResponse(newDevice))
}

func (rs *deviceResource) FindOne(w http.ResponseWriter, r *http.Request) {
	device, ok := r.Context().Value(deviceContextKey).(*db.Device)
	if !ok {
		render.Render(w, r, ErrInternal(errors.New("context error")))
		return
	}

	render.Render(w, r, NewDeviceResponse(device))
}

func (rs *deviceResource) Update(w http.ResponseWriter, r *http.Request) {
	currentDevice, ok := r.Context().Value(deviceContextKey).(*db.Device)
	if !ok {
		render.Render(w, r, ErrInternal(errors.New("context error")))
		return
	}

	data := &DeviceRequest{}
	if err := render.Bind(r, data); err != nil {
		render.Render(w, r, ErrInvalidRequest(err))
		return
	}

	currentDevice.Name = data.Name

	if err := rs.store.UpdateDevice(r.Context(), currentDevice); err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	render.Render(w, r, NewDeviceResponse(currentDevice))
}

func (rs *deviceResource) Delete(w http.ResponseWriter, r *http.Request) {
	device, ok := r.Context().Value(deviceContextKey).(*db.Device)
	if !ok {
		render.Render(w, r, ErrInternal(errors.New("context error")))
		return
	}

	err := rs.store.DeleteDeviceByID(r.Context(), device.ID)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	render.Render(w, r, NewDeviceResponse(device))
}
