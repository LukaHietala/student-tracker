package api

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
	"github.com/lukahietala/rfid/db"
	"github.com/lukahietala/rfid/websockets"
)

type groupsResource struct{}

func (rs groupsResource) Routes() chi.Router {
	r := chi.NewRouter()

	r.Get("/", rs.List)
	r.Post("/", rs.Create)
	r.Route("/{id}", func(r chi.Router) {
		r.Use(rs.GroupCtx)
		r.Get("/", rs.FindOne)
		r.Put("/", rs.Update)
		r.Delete("/", rs.Archive)
	})

	r.Route("/archive", func(r chi.Router) {
		r.Get("/", rs.ListArchived)
		r.Route("/{id}", func(r chi.Router) {
			r.Use(rs.GroupCtx)
			r.Delete("/", rs.Delete)
		})
	})

	return r
}

func (rs groupsResource) GroupCtx(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var group *db.Group
		var err error

		groupIDStr := chi.URLParam(r, "id")
		if groupIDStr == "" {
			render.Render(w, r, ErrNotFound())
			return
		}

		groupID, err := strconv.Atoi(groupIDStr)
		if err != nil {
			render.Render(w, r, ErrInternal(err))
			return
		}

		group, err = store.FindGroupByID(r.Context(), groupID)
		if err != nil {
			render.Render(w, r, ErrNotFound())
			return
		}

		ctx := context.WithValue(r.Context(), "group", group)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (rs groupsResource) List(w http.ResponseWriter, r *http.Request) {
	groups, err := store.ListGroups(r.Context(), false)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	render.JSON(w, r, groups)
}

func (rs groupsResource) Create(w http.ResponseWriter, r *http.Request) {
	var group db.Group
	if err := render.Decode(r, &group); err != nil {
		render.Render(w, r, ErrInvalidRequest(errors.New("invalid json payload")))
		return
	}

	if err := group.Validate(); err != nil {
		render.Render(w, r, ErrInvalidRequest(err))
		return
	}

	if err := store.AddGroup(r.Context(), &group); err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	bytes, err := json.Marshal(group)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	hub.Broadcast(websockets.Event{
		Event:   "group:new",
		Payload: bytes,
	})

	render.Status(r, http.StatusCreated)
	render.JSON(w, r, group)
}

func (rs groupsResource) FindOne(w http.ResponseWriter, r *http.Request) {
	group := r.Context().Value("group").(*db.Group)
	render.JSON(w, r, group)
}

func (rs groupsResource) Update(w http.ResponseWriter, r *http.Request) {
	group := r.Context().Value("group").(*db.Group)

	var req db.Group
	if err := render.Decode(r, &req); err != nil {
		render.Render(w, r, ErrInvalidRequest(errors.New("invalid json payload")))
		return
	}

	if err := req.Validate(); err != nil {
		render.Render(w, r, ErrInvalidRequest(err))
		return
	}

	if err := store.UpdateGroup(r.Context(), group.ID, &req); err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	bytes, err := json.Marshal(req)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	hub.Broadcast(websockets.Event{
		Event:   "group:update",
		Payload: bytes,
	})

	render.Status(r, 200)
	render.JSON(w, r, group)
}

func (rs groupsResource) Archive(w http.ResponseWriter, r *http.Request) {
	group := r.Context().Value("group").(*db.Group)

	err := store.ArchiveGroupByID(r.Context(), group.ID)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	bytes, err := json.Marshal(group)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	hub.Broadcast(websockets.Event{
		Event:   "group:archive",
		Payload: bytes,
	})

	render.Status(r, 200)
	render.JSON(w, r, group)
}

func (rs groupsResource) ListArchived(w http.ResponseWriter, r *http.Request) {
	groups, err := store.ListGroups(r.Context(), true)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	render.JSON(w, r, groups)
}

func (rs groupsResource) Delete(w http.ResponseWriter, r *http.Request) {
	group := r.Context().Value("group").(*db.Group)

	err := store.DeleteGroupByID(r.Context(), group.ID)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	render.Status(r, 200)
	render.JSON(w, r, group)
}
