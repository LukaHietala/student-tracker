package api

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/jwtauth/v5"
	"github.com/go-chi/render"
	"github.com/lukahietala/rfid/internal/auth"
	"github.com/lukahietala/rfid/internal/db"
)

type sessionResource struct {
	store *db.Store
	auth  *auth.Auth
}

func NewSessionResource(s *db.Store, a *auth.Auth) *sessionResource {
	return &sessionResource{store: s, auth: a}
}

func (rs *sessionResource) Routes() chi.Router {
	r := chi.NewRouter()

	r.Get("/self", rs.Self)
	return r
}

func (rs *sessionResource) Self(w http.ResponseWriter, r *http.Request) {
	_, claims, _ := jwtauth.FromContext(r.Context())

	id, ok := claims["teacher_id"].(float64)
	if !ok {
		render.Render(w, r, ErrInvalidRequest(errors.New("invalid teacher id")))
		return
	}

	teacher, err := rs.store.FindTeacherByID(r.Context(), int(id))
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	render.Render(w, r, NewTeacherResponse(teacher))
}
