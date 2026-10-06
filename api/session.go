package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
)

type sessionResource struct{}

func (rs sessionResource) Routes() chi.Router {
	r := chi.NewRouter()

	r.Get("/self", rs.Self)

	return r
}

func (rs sessionResource) Self(w http.ResponseWriter, r *http.Request) {
	teacher, err := store.GetSelf(r.Context())
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	render.JSON(w, r, teacher)
}
