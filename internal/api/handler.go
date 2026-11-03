package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/lukahietala/rfid/internal/auth"
	"github.com/lukahietala/rfid/internal/db"
	"github.com/lukahietala/rfid/internal/websockets"
)

func NewHandler(s *db.Store, a *auth.Auth, h *websockets.Hub) *chi.Mux {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(a.Verifier())

	r.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		websockets.ServeWs(h, w, r)
	})

	r.Route("/api", func(r chi.Router) {
		r.Mount("/students", NewStudentResource(s, a, h).Routes())
		r.Mount("/devices", NewDeviceResource(s, a).Routes())
		r.Mount("/scans", NewScanResource(s, a, h).Routes())
		r.Mount("/groups", NewGroupResource(s, a).Routes())
		r.Mount("/teachers", NewTeacherResource(s, a).Routes())
		r.Mount("/auth", NewAuthResource(s, a).Routes())
	})

	return r
}
