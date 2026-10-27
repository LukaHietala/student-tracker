package api

import (
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
	"github.com/lukahietala/rfid/internal/auth"
	"github.com/lukahietala/rfid/internal/db"
	"github.com/lukahietala/rfid/internal/websockets"
)

type scanResource struct {
	store *db.Store
	auth  *auth.Auth
	hub   *websockets.Hub
}

func NewScanResource(s *db.Store, a *auth.Auth, h *websockets.Hub) *scanResource {
	return &scanResource{store: s, auth: a, hub: h}
}

func (rs *scanResource) Routes() chi.Router {
	r := chi.NewRouter()

	r.Group(func(r chi.Router) {
		r.Use(rs.auth.Authenticator())

		r.Get("/", rs.List)
		r.Get("/student/{studentID}", rs.ListByStudent)
	})

	r.Post("/new", rs.Create)

	return r
}

type ScanRequest struct {
	UID       string `json:"uid"`
	Timestamp int64  `json:"timestamp"`
	Secret    string `json:"secret"`
}

func (s *ScanRequest) Bind(r *http.Request) error {
	s.UID = strings.TrimSpace(s.UID)

	if s.UID == "" {
		return errors.New("scan uid is required")
	}
	if s.Timestamp == 0 {
		return errors.New("scan timestamp is required")
	}
	if s.Secret == "" {
		return errors.New("device secret is required")
	}

	decoded, err := hex.DecodeString(s.UID)
	if err != nil {
		return errors.New("scan uid is not valid")
	}

	if len(decoded) != 4 && len(decoded) != 7 {
		return errors.New("scan uid length is not valid")
	}

	// TODO: Clock skew

	return nil
}

type ScanResponse struct {
	*db.Scan
}

func NewScanResponse(scan *db.Scan) *ScanResponse {
	return &ScanResponse{Scan: scan}
}

func (s *ScanResponse) Render(w http.ResponseWriter, r *http.Request) error {
	return nil
}

func NewScanListResponse(scans []*db.Scan) []render.Renderer {
	list := []render.Renderer{}
	for _, scan := range scans {
		list = append(list, NewScanResponse(scan))
	}
	return list
}

// TODO: Context if needed

func (rs *scanResource) List(w http.ResponseWriter, r *http.Request) {
	scans, err := rs.store.ListScans(r.Context())
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	render.RenderList(w, r, NewScanListResponse(scans))
}

func (rs *scanResource) ListByStudent(w http.ResponseWriter, r *http.Request) {
	studentIDStr := chi.URLParam(r, "studentID")
	if studentIDStr == "" {
		render.Render(w, r, ErrNotFound())
		return
	}

	studentID, err := strconv.Atoi(studentIDStr)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	scans, err := rs.store.ListScansByStudentID(r.Context(), studentID)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	render.RenderList(w, r, NewScanListResponse(scans))
}

func (rs *scanResource) Create(w http.ResponseWriter, r *http.Request) {
	data := &ScanRequest{}
	if err := render.Bind(r, data); err != nil {
		render.Render(w, r, ErrInvalidRequest(err))
		return
	}

	_, err := rs.store.FindDeviceBySecret(r.Context(), data.Secret)
	if err != nil {
		render.Render(w, r, ErrInvalidRequest(errors.New("no device found with secret")))
		return
	}

	newScan := &db.Scan{
		UID:       data.UID,
		Timestamp: time.Unix(data.Timestamp, 0).Format(time.DateTime),
	}

	student, err := rs.store.FindStudentByUID(r.Context(), data.UID)
	if err != nil || student == nil || student.IsArchived {
		// If no student found it will send the scan event but with student id
		// and group id as 0
		if bytes, err := json.Marshal(newScan); err == nil {
			rs.hub.Broadcast(websockets.Event{
				Event:   "scan:new",
				Payload: bytes,
			})
		}
		w.WriteHeader(http.StatusOK)
		return
	}

	if student.Status == "IN" {
		student.Status = "OUT"
	} else {
		student.Status = "IN"
	}

	if err := rs.store.UpdateStudent(r.Context(), student); err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	if bytes, err := json.Marshal(student); err == nil {
		rs.hub.Broadcast(websockets.Event{
			Event:   "student:update",
			Payload: bytes,
		})
	}

	newScan.StudentID = student.ID
	newScan.GroupID = student.GroupID
	newScan.NewStatus = student.Status

	if err := rs.store.NewScan(r.Context(), newScan); err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	if bytes, err := json.Marshal(newScan); err == nil {
		rs.hub.Broadcast(websockets.Event{
			Event:   "scan:new",
			Payload: bytes,
		})
	}

	w.WriteHeader(http.StatusCreated)
}
