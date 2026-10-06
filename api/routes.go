package api

import (
	"errors"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/jwtauth/v5"
	"github.com/go-chi/render"
	"github.com/lukahietala/rfid/db"
	"github.com/lukahietala/rfid/websockets"
)

var store *db.Store
var hub *websockets.Hub

func NewRouter(s *db.Store, h *websockets.Hub) *chi.Mux {
	// Asiatonta
	store = s
	hub = h

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(jwtauth.Verifier(tokenAuth))

	r.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		websockets.ServeWs(hub, w, r)
	})

	templateFs := os.DirFS("web/templates/")
	staticFs := os.DirFS("web/static/")
	FileServer(r, "/static", staticFs)

	r.Group(func(r chi.Router) {
		r.Use(UnloggedInRedirector)
		r.Get("/", func(w http.ResponseWriter, r *http.Request) {
			http.ServeFileFS(w, r, templateFs, "index.html")
		})

		r.Get("/archive", func(w http.ResponseWriter, r *http.Request) {
			http.ServeFileFS(w, r, templateFs, "archive.html")
		})

		r.Get("/logout", func(w http.ResponseWriter, r *http.Request) {
			ResetJWTCookies(w)
			http.Redirect(w, r, "/login", 303)
		})
	})

	r.Route("/onboarding", func(r chi.Router) {
		r.Use(OnboardingRedirector)
		r.Get("/", func(w http.ResponseWriter, r *http.Request) {
			http.ServeFileFS(w, r, templateFs, "onboarding.html")
		})
	})

	r.Route("/login", func(r chi.Router) {
		r.Use(LoggedInRedirector)
		r.Get("/", func(w http.ResponseWriter, r *http.Request) {
			http.ServeFileFS(w, r, templateFs, "login.html")
		})
		r.Post("/", Login)
	})

	r.Route("/api", func(r chi.Router) {
		r.Mount("/students", studentsResource{}.Routes())
		r.Mount("/devices", devicesResource{}.Routes())
		r.Mount("/scans", scanResource{}.Routes())
		r.Mount("/groups", groupsResource{}.Routes())
		r.Mount("/teachers", teachersResource{}.Routes())
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

type LoginRequest struct {
	Name     string `json:"name"`
	Password string `json:"password"`
}

func Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := render.Decode(r, &req); err != nil {
		render.Render(w, r, ErrInvalidRequest(err))
		return
	}

	if req.Name == "" || req.Password == "" {
		render.Render(w, r, ErrInvalidRequest(errors.New("name and password are required")))
		return
	}

	id, err := store.VerifyTeacher(req.Name, req.Password)
	if err != nil {
		render.Render(w, r, ErrInvalidRequest(errors.New("name or password are incorrect")))
		return
	}

	token := MakeSessionToken(id)

	http.SetCookie(w, &http.Cookie{
		HttpOnly: true,
		Expires:  time.Now().Add(28 * 24 * time.Hour),
		SameSite: http.SameSiteLaxMode,
		// Uncomment below for HTTPS:
		// Secure: true,
		Name:  "jwt",
		Value: token,
	})

	render.Status(r, 200)
}

type ErrResponse struct {
	HTTPStatusCode int    `json:"-"`
	ErrorText      string `json:"error"`
}

func (e *ErrResponse) Render(w http.ResponseWriter, r *http.Request) error {
	render.Status(r, e.HTTPStatusCode)
	return nil
}

func ErrInvalidRequest(err error) render.Renderer {
	return &ErrResponse{
		HTTPStatusCode: http.StatusBadRequest,
		ErrorText:      err.Error(),
	}
}

func ErrInternal(err error) render.Renderer {
	log.Println("internal error:", err)
	return &ErrResponse{
		HTTPStatusCode: http.StatusInternalServerError,
		ErrorText:      http.StatusText(http.StatusInternalServerError),
	}
}

func ErrNotFound() render.Renderer {
	return &ErrResponse{
		HTTPStatusCode: http.StatusNotFound,
		ErrorText:      http.StatusText(http.StatusNotFound),
	}
}
