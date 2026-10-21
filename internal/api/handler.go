package api

import (
	"io/fs"
	"net/http"
	"os"
	"strings"

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

	templateFs := os.DirFS("web/templates/")
	staticFs := os.DirFS("web/static/")
	FileServer(r, "/static", staticFs)

	r.Group(func(r chi.Router) {
		r.Use(a.UnloggedInRedirector)
		r.Get("/", func(w http.ResponseWriter, r *http.Request) {
			http.ServeFileFS(w, r, templateFs, "index.html")
		})

		r.Get("/archive", func(w http.ResponseWriter, r *http.Request) {
			http.ServeFileFS(w, r, templateFs, "archive.html")
		})

		r.Get("/teachers", func(w http.ResponseWriter, r *http.Request) {
			http.ServeFileFS(w, r, templateFs, "teachers.html")
		})
	})

	r.With(a.OnboardingRedirector).Get("/onboarding", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFileFS(w, r, templateFs, "onboarding.html")
	})

	r.With(a.LoggedInRedirector).Get("/login", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFileFS(w, r, templateFs, "login.html")
	})

	r.Route("/api", func(r chi.Router) {
		r.Mount("/students", NewStudentResource(s, a, h).Routes())
		r.Mount("/devices", NewDeviceResource(s, a).Routes())
		r.Mount("/scans", NewScanResource(s, a).Routes())
		r.Mount("/groups", NewGroupResource(s, a).Routes())
		r.Mount("/teachers", NewTeacherResource(s, a).Routes())
		r.Mount("/auth", NewAuthResource(s, a).Routes())
		r.Mount("/session", NewSessionResource(s, a).Routes())
	})

	return r
}

func FileServer(r chi.Router, path string, rootFS fs.FS) {
	root := http.FS(rootFS)
	if strings.ContainsAny(path, "{}*") {
		panic("FileServer does not permit any URL parameters.")
	}

	if path != "/" && path[len(path)-1] != '/' {
		r.Get(path, http.RedirectHandler(path+"/", 301).ServeHTTP)
		path += "/"
	}
	path += "*"

	r.Get(path, func(w http.ResponseWriter, r *http.Request) {
		rctx := chi.RouteContext(r.Context())
		pathPrefix := strings.TrimSuffix(rctx.RoutePattern(), "/*")
		fs := http.StripPrefix(pathPrefix, http.FileServer(root))
		fs.ServeHTTP(w, r)
	})
}
