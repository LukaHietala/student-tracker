package api

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
	"github.com/lukahietala/rfid/internal/auth"
	"github.com/lukahietala/rfid/internal/db"
)

type scanResource struct {
	store *db.Store
	auth  *auth.Auth
}

func NewScanResource(s *db.Store, a *auth.Auth) *scanResource {
	return &scanResource{store: s, auth: a}
}

func (rs *scanResource) Routes() chi.Router {
	r := chi.NewRouter()
	r.Use(rs.auth.Authenticator())

	r.Get("/", rs.List)
	r.Get("/student/{studentID}", rs.ListByStudent)

	return r
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
