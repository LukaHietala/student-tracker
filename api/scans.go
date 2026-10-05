package api

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
)

type scanResource struct{}

func (rs scanResource) Routes() chi.Router {
	r := chi.NewRouter()

	r.Get("/", rs.List)
	r.Get("/student/{id}", rs.ListByStudent)

	return r
}

func (rs scanResource) List(w http.ResponseWriter, r *http.Request) {
	scans, err := store.ListScans(r.Context())
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	render.JSON(w, r, scans)
}

func (rs scanResource) ListByStudent(w http.ResponseWriter, r *http.Request) {
	studentIDStr := chi.URLParam(r, "id")
	if studentIDStr == "" {
		render.Render(w, r, ErrNotFound())
		return
	}

	studentID, err := strconv.Atoi(studentIDStr)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	scans, err := store.ListScansByStudentID(r.Context(), studentID)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	render.JSON(w, r, scans)
}
