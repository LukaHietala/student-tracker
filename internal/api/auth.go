package api

import (
	"errors"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"

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

	r.Post("/logout", rs.Logout)
	r.Get("/self", rs.Self)

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
		Path:     "/",
		// Secure: true,
		Name:  "jwt",
		Value: token,
	})

	w.WriteHeader(http.StatusNoContent)
}

type RegisterRequest struct {
	Name     string `json:"name"`
	Password string `json:"password"`
}

func (re *RegisterRequest) Bind(r *http.Request) error {
	re.Name = strings.TrimSpace(re.Name)
	re.Password = strings.TrimSpace(re.Password)

	if re.Name == "" {
		return errors.New("name is required")
	}
	if re.Password == "" {
		return errors.New("password is required")
	}
	if utf8.RuneCountInString(re.Name) > 50 {
		return errors.New("name is too long (max 50)")
	}
	if utf8.RuneCountInString(re.Password) < 3 {
		return errors.New("name is too short (min 3)")
	}
	if utf8.RuneCountInString(re.Password) > 50 {
		return errors.New("password is too long (max 50)")
	}
	if utf8.RuneCountInString(re.Password) < 8 {
		return errors.New("password is too short (min 8)")
	}

	return nil
}

func (rs *authResource) Register(w http.ResponseWriter, r *http.Request) {
	data := &RegisterRequest{}
	if err := render.Bind(r, data); err != nil {
		render.Render(w, r, ErrInvalidRequest(err))
		return
	}

	teacher := &db.Teacher{
		Name:          data.Name,
		PasswordPlain: data.Password,
	}

	if err := rs.store.AddTeacher(r.Context(), teacher); err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (rs *authResource) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		HttpOnly: true,
		MaxAge:   -1,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		// Secure: true,
		Name:  "jwt",
		Value: "",
	})

	w.WriteHeader(http.StatusNoContent)
}

type SelfResponse struct {
	User          *db.Teacher `json:"user,omitempty"`
	Authenticated bool        `json:"authenticated"`
}

func NewSelfResponse(user *db.Teacher, authenticated bool) *SelfResponse {
	return &SelfResponse{User: user, Authenticated: authenticated}
}

func (l *SelfResponse) Render(w http.ResponseWriter, r *http.Request) error {
	if l.User != nil {
		l.User.PasswordPlain = ""
		l.User.PasswordHash = ""
	}
	return nil
}

func (rs *authResource) Self(w http.ResponseWriter, r *http.Request) {
	userID, ok := getTeacherID(r)
	if !ok {
		render.Render(w, r, NewSelfResponse(nil, false))
		return
	}

	teacher, err := rs.store.FindTeacherByID(r.Context(), userID)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	render.Render(w, r, NewSelfResponse(teacher, true))
}
