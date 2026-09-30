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

type teachersResource struct{}

func (rs teachersResource) Routes() chi.Router {
	r := chi.NewRouter()

	r.Get("/", rs.List)
	r.Post("/", rs.Create)
	r.Route("/{id}", func(r chi.Router) {
		r.Use(rs.TeacherCtx)
		r.Get("/", rs.FindOne)
		r.Put("/", rs.Update)
		r.Delete("/", rs.Delete)
	})

	return r
}

func (rs teachersResource) TeacherCtx(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var teacher *db.Teacher
		var err error

		teacherIDStr := chi.URLParam(r, "id")
		if teacherIDStr == "" {
			render.Render(w, r, ErrNotFound())
			return
		}

		teacherID, err := strconv.Atoi(teacherIDStr)
		if err != nil {
			render.Render(w, r, ErrInternal(err))
			return
		}

		teacher, err = store.FindTeacherByID(r.Context(), teacherID)
		if err != nil {
			render.Render(w, r, ErrNotFound())
			return
		}

		ctx := context.WithValue(r.Context(), "teacher", teacher)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (rs teachersResource) List(w http.ResponseWriter, r *http.Request) {
	teachers, err := store.ListTeachers(r.Context())
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	render.JSON(w, r, teachers)
}

func (rs teachersResource) Create(w http.ResponseWriter, r *http.Request) {
	var teacher db.Teacher
	if err := render.Decode(r, &teacher); err != nil {
		render.Render(w, r, ErrInvalidRequest(errors.New("invalid json payload")))
		return
	}

	if err := teacher.Validate(); err != nil {
		render.Render(w, r, ErrInvalidRequest(err))
		return
	}

	// Have to do the validation here because this should only be validated at
	// creation
	if teacher.PasswordPlain == "" {
		render.Render(w, r, ErrInvalidRequest(errors.New("password can't be empty")))
		return
	}

	if len(teacher.PasswordPlain) < 1 || len(teacher.PasswordPlain) > 255 {
		render.Render(w, r, ErrInvalidRequest(errors.New("password is not in the valid range 1-255")))
		return
	}

	if err := store.AddTeacher(r.Context(), &teacher); err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	bytes, err := json.Marshal(teacher)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	hub.Broadcast(websockets.Event{
		Event:   "teacher:new",
		Payload: bytes,
	})

	render.Status(r, http.StatusCreated)
	render.JSON(w, r, teacher)
}

func (rs teachersResource) FindOne(w http.ResponseWriter, r *http.Request) {
	teacher := r.Context().Value("teacher").(*db.Teacher)
	render.JSON(w, r, teacher)
}

func (rs teachersResource) Update(w http.ResponseWriter, r *http.Request) {
	teacher := r.Context().Value("teacher").(*db.Teacher)

	var req db.Teacher
	if err := render.Decode(r, &req); err != nil {
		render.Render(w, r, ErrInvalidRequest(errors.New("invalid json payload")))
		return
	}

	if err := req.Validate(); err != nil {
		render.Render(w, r, ErrInvalidRequest(err))
		return
	}

	if err := store.UpdateTeacher(r.Context(), teacher.ID, &req); err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	bytes, err := json.Marshal(req)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	hub.Broadcast(websockets.Event{
		Event:   "teacher:update",
		Payload: bytes,
	})

	render.Status(r, 200)
	render.JSON(w, r, teacher)
}

func (rs teachersResource) Delete(w http.ResponseWriter, r *http.Request) {
	teacher := r.Context().Value("teacher").(*db.Teacher)

	err := store.DeleteTeacherByID(r.Context(), teacher.ID)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	render.Status(r, 200)
	render.JSON(w, r, teacher)
}
