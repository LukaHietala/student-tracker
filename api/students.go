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

type studentsResource struct{}

func (rs studentsResource) Routes() chi.Router {
	r := chi.NewRouter()

	r.Get("/", rs.List)
	r.Get("/all", rs.ListAll)
	r.Route("/{id}", func(r chi.Router) {
		r.Use(rs.StudentCtx)
		r.Get("/", rs.FindOne)
		r.Put("/", rs.Update)
		r.Delete("/", rs.Archive)
		r.Post("/unarchive", rs.Unrchive)
	})

	r.Route("/archive", func(r chi.Router) {
		r.Get("/", rs.ListArchived)
		r.Route("/{id}", func(r chi.Router) {
			r.Use(rs.StudentCtx)
			r.Delete("/", rs.Delete)
		})
	})

	return r
}

func (rs studentsResource) StudentCtx(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var student *db.Student
		var err error

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

		student, err = store.FindStudentByID(r.Context(), studentID)
		if err != nil {
			render.Render(w, r, ErrNotFound())
			return
		}

		ctx := context.WithValue(r.Context(), "student", student)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (rs studentsResource) List(w http.ResponseWriter, r *http.Request) {
	students, err := store.ListStudents(r.Context(), false)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	render.JSON(w, r, students)
}

func (rs studentsResource) ListAll(w http.ResponseWriter, r *http.Request) {
	students, err := store.ListAllStudents(r.Context())
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	render.JSON(w, r, students)
}

func (rs studentsResource) FindOne(w http.ResponseWriter, r *http.Request) {
	student := r.Context().Value("student").(*db.Student)
	render.JSON(w, r, student)
}

func (rs studentsResource) Update(w http.ResponseWriter, r *http.Request) {
	student := r.Context().Value("student").(*db.Student)

	var req db.Student
	if err := render.Decode(r, &req); err != nil {
		render.Render(w, r, ErrInvalidRequest(errors.New("invalid json payload")))
		return
	}

	if err := req.Validate(); err != nil {
		render.Render(w, r, ErrInvalidRequest(err))
		return
	}

	if err := store.UpdateStudent(r.Context(), student.ID, &req); err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	bytes, err := json.Marshal(req)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	hub.Broadcast(websockets.Event{
		Event:   "student:update",
		Payload: bytes,
	})

	render.Status(r, 200)
	render.JSON(w, r, student)
}

func (rs studentsResource) Archive(w http.ResponseWriter, r *http.Request) {
	student := r.Context().Value("student").(*db.Student)

	err := store.ArchiveStudentByID(r.Context(), student.ID)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	bytes, err := json.Marshal(student)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	hub.Broadcast(websockets.Event{
		Event:   "student:archive",
		Payload: bytes,
	})

	render.Status(r, 200)
	render.JSON(w, r, student)
}

func (rs studentsResource) Unrchive(w http.ResponseWriter, r *http.Request) {
	student := r.Context().Value("student").(*db.Student)

	err := store.UnarchiveStudentByID(r.Context(), student.ID)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	bytes, err := json.Marshal(student)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	hub.Broadcast(websockets.Event{
		Event:   "student:unarchive",
		Payload: bytes,
	})

	render.Status(r, 200)
	render.JSON(w, r, student)
}

func (rs studentsResource) ListArchived(w http.ResponseWriter, r *http.Request) {
	students, err := store.ListStudents(r.Context(), true)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	render.JSON(w, r, students)
}

func (rs studentsResource) Delete(w http.ResponseWriter, r *http.Request) {
	student := r.Context().Value("student").(*db.Student)

	err := store.DeleteStudentByID(r.Context(), student.ID)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	render.Status(r, 200)
	render.JSON(w, r, student)
}
