package api

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
	"github.com/lukahietala/rfid/internal/auth"
	"github.com/lukahietala/rfid/internal/db"
)

type teacherResource struct {
	store *db.Store
	auth  *auth.Auth
}

func NewTeacherResource(s *db.Store, a *auth.Auth) *teacherResource {
	return &teacherResource{store: s, auth: a}
}

func (rs *teacherResource) Routes() chi.Router {
	r := chi.NewRouter()
	r.Use(rs.auth.Authenticator())

	r.Get("/", rs.List)
	r.Post("/", rs.Create)

	r.Route("/{teacherID}", func(r chi.Router) {
		r.Use(rs.TeacherCtx)
		r.Get("/", rs.FindOne)
		r.Put("/", rs.Update)
		r.Delete("/", rs.Delete)
	})

	return r
}

type TeacherRequest struct {
	Name          string `json:"name"`
	PasswordPlain string `json:"passwordPlain"`
}

func (t *TeacherRequest) Bind(r *http.Request) error {
	t.Name = strings.TrimSpace(t.Name)
	t.PasswordPlain = strings.TrimSpace(t.PasswordPlain)

	if t.Name == "" {
		return errors.New("teacher name is required")
	}
	if utf8.RuneCountInString(t.Name) > 50 {
		return errors.New("teacher name is too long (max 50)")
	}
	if utf8.RuneCountInString(t.Name) < 2 {
		return errors.New("teacher name is too short (min 2)")
	}
	if t.PasswordPlain == "" {
		return nil
	}
	if utf8.RuneCountInString(t.PasswordPlain) > 50 {
		return errors.New("teacher password is too long (max 50)")
	}
	// :D
	if utf8.RuneCountInString(t.PasswordPlain) < 8 {
		return errors.New("teacher password is too short (min 8)")
	}

	return nil
}

type TeacherResponse struct {
	*db.Teacher
}

func NewTeacherResponse(teacher *db.Teacher) *TeacherResponse {
	return &TeacherResponse{Teacher: teacher}
}

func (t *TeacherResponse) Render(w http.ResponseWriter, r *http.Request) error {
	t.PasswordHash = ""
	t.PasswordPlain = ""
	return nil
}

func NewTeacherListResponse(teachers []*db.Teacher) []render.Renderer {
	list := []render.Renderer{}
	for _, teacher := range teachers {
		list = append(list, NewTeacherResponse(teacher))
	}
	return list
}

func (rs *teacherResource) TeacherCtx(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		teacherIDStr := chi.URLParam(r, "teacherID")
		if teacherIDStr == "" {
			render.Render(w, r, ErrInvalidRequest(errors.New("teacher id is missing")))
			return
		}

		teacherID, err := strconv.Atoi(teacherIDStr)
		if err != nil {
			render.Render(w, r, ErrInvalidRequest(err))
			return
		}

		teacher, err := rs.store.FindTeacherByID(r.Context(), teacherID)
		if err != nil {
			render.Render(w, r, ErrNotFound())
			return
		}

		ctx := context.WithValue(r.Context(), teacherContextKey, teacher)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (rs *teacherResource) List(w http.ResponseWriter, r *http.Request) {
	teachers, err := rs.store.ListTeachers(r.Context())
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	render.RenderList(w, r, NewTeacherListResponse(teachers))
}

func (rs *teacherResource) Create(w http.ResponseWriter, r *http.Request) {
	data := &TeacherRequest{}
	if err := render.Bind(r, data); err != nil {
		render.Render(w, r, ErrInvalidRequest(err))
		return
	}

	newTeacher := &db.Teacher{
		Name:          data.Name,
		PasswordPlain: data.PasswordPlain,
	}

	if err := rs.store.AddTeacher(r.Context(), newTeacher); err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	render.Status(r, http.StatusCreated)
	render.Render(w, r, NewTeacherResponse(newTeacher))
}

func (rs *teacherResource) FindOne(w http.ResponseWriter, r *http.Request) {
	teacher, ok := r.Context().Value(teacherContextKey).(*db.Teacher)
	if !ok {
		render.Render(w, r, ErrInternal(errors.New("context error")))
		return
	}

	render.Render(w, r, NewTeacherResponse(teacher))
}

func (rs *teacherResource) Update(w http.ResponseWriter, r *http.Request) {
	currentTeacher, ok := r.Context().Value(teacherContextKey).(*db.Teacher)
	if !ok {
		render.Render(w, r, ErrInternal(errors.New("context error")))
		return
	}

	data := &TeacherRequest{}
	if err := render.Bind(r, data); err != nil {
		render.Render(w, r, ErrInvalidRequest(err))
		return
	}

	currentTeacher.Name = data.Name
	currentTeacher.PasswordPlain = data.PasswordPlain

	if err := rs.store.UpdateTeacher(r.Context(), currentTeacher); err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	render.Render(w, r, NewTeacherResponse(currentTeacher))
}

func (rs *teacherResource) Delete(w http.ResponseWriter, r *http.Request) {
	teacher, ok := r.Context().Value(teacherContextKey).(*db.Teacher)
	if !ok {
		render.Render(w, r, ErrInternal(errors.New("context error")))
		return
	}

	err := rs.store.DeleteTeacherByID(r.Context(), teacher.ID)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	render.Render(w, r, NewTeacherResponse(teacher))
}
