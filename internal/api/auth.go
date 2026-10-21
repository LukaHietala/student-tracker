package api

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
	"github.com/lukahietala/rfid/internal/auth"
	"github.com/lukahietala/rfid/internal/db"
)

type authResource struct {
	store *db.Store
	auth  *auth.Auth
}

func NewAuthResource(s *db.Store, a *auth.Auth) *authResource {
	return &authResource{store: s, auth: a}
}

func (rs *authResource) Routes() chi.Router {
	r := chi.NewRouter()

	r.Group(func(r chi.Router) {
		r.Use(rs.auth.RejectAuthenticated)
		r.Post("/login", rs.Login)
	})

	// Asiatonta
	r.With(rs.auth.Authenticator()).Get("/logout", rs.Logout)

	return r
}

type LoginRequest struct {
	Name     string `json:"name"`
	Password string `json:"password"`
}

func (l *LoginRequest) Bind(r *http.Request) error {
	l.Name = strings.TrimSpace(l.Name)
	l.Password = strings.TrimSpace(l.Password)

	if l.Name == "" {
		return errors.New("name is required")
	}
	if l.Password == "" {
		return errors.New("password is required")
	}

	return nil
}

func (rs *authResource) Login(w http.ResponseWriter, r *http.Request) {
	data := &LoginRequest{}
	if err := render.Bind(r, data); err != nil {
		render.Render(w, r, ErrInvalidRequest(err))
		return
	}

	id, err := rs.store.VerifyTeacher(r.Context(), data.Name, data.Password)
	if err != nil {
		render.Render(w, r, ErrInvalidRequest(errors.New("name or password are incorrect")))
		return
	}

	token, err := rs.auth.MakeSessionToken(id)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	http.SetCookie(w, &http.Cookie{
		HttpOnly: true,
		Expires:  time.Now().Add(24 * 28 * time.Hour),
		SameSite: http.SameSiteLaxMode,
		// Secure: true,
		Path:  "/",
		Name:  "jwt",
		Value: token,
	})

	w.WriteHeader(http.StatusNoContent)
}

func (rs *authResource) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		HttpOnly: true,
		MaxAge:   -1,
		SameSite: http.SameSiteLaxMode,
		// Secure: true,
		Path:  "/",
		Name:  "jwt",
		Value: "",
	})

	w.WriteHeader(http.StatusNoContent)
}
