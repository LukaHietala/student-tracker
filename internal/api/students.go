package api

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
	"github.com/lukahietala/rfid/internal/auth"
	"github.com/lukahietala/rfid/internal/db"
	"github.com/lukahietala/rfid/internal/websockets"
)

type studentResource struct {
	store *db.Store
	auth  *auth.Auth
	hub   *websockets.Hub
}

func NewStudentResource(s *db.Store, a *auth.Auth, h *websockets.Hub) *studentResource {
	return &studentResource{store: s, auth: a, hub: h}
}

func (rs *studentResource) Routes() chi.Router {
	r := chi.NewRouter()
	r.Use(rs.auth.Authenticator())

	r.Get("/", rs.List)
	r.Route("/{studentID}", func(r chi.Router) {
		r.Use(rs.StudentCtx)
		r.Get("/", rs.FindOne)
		r.Put("/", rs.Update)
		r.Delete("/", rs.Archive)
		r.Post("/unarchive", rs.Unarchive)
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

type StudentRequest struct {
	UID          string             `json:"uid"`
	Name         string             `json:"name"`
	Status       string             `json:"status"`
	StartDate    string             `json:"start_date"`
	EndDate      string             `json:"end_date"`
	Schedule     db.Schedule        `json:"schedule"`
	DoneSeconds  int                `json:"done_seconds"`
	ExcludedDays db.JSONStringSlice `json:"excluded_days"`
	BreakTime    int                `json:"break_time"`
}

func (s *StudentRequest) Bind(r *http.Request) error {
	s.Name = strings.TrimSpace(s.Name)
	s.UID = strings.TrimSpace(s.UID)

	decoded, err := hex.DecodeString(s.UID)
	if err != nil {
		return errors.New("invalid student uid format")
	}
	if len(decoded) != 4 && len(decoded) != 7 {
		return errors.New("rfid uid length must be either 4 or 7")
	}

	if s.Name == "" {
		return errors.New("student name is required")
	}
	if utf8.RuneCountInString(s.Name) > 50 {
		return errors.New("student name is too long (max 50)")
	}
	if utf8.RuneCountInString(s.Name) < 3 {
		return errors.New("student name is too short (min 3)")
	}

	if s.Status == "" {
		s.Status = "OUT"
	}
	if s.Status != "IN" && s.Status != "OUT" {
		return errors.New("student status must be either IN or OUT")
	}

	start, err := time.Parse(time.DateOnly, s.StartDate)
	if err != nil {
		return errors.New("start day is in invalid format")
	}
	end, err := time.Parse(time.DateOnly, s.EndDate)
	if err != nil {
		return errors.New("end date is in invalid format")
	}
	if !end.After(start) {
		return errors.New("end date must be after start date")
	}

	for weekday, day := range s.Schedule {
		if day == nil {
			continue
		}
		dayStarts, err := time.Parse(time.TimeOnly, day.Start)
		if err != nil {
			return fmt.Errorf("start time is in invalid format at weekday %d", weekday)
		}
		dayEnds, err := time.Parse(time.TimeOnly, day.End)
		if err != nil {
			return fmt.Errorf("end time is in invalid format at weekday %d", weekday)
		}

		if !dayEnds.After(dayStarts) {
			return errors.New("end time must be after start time")
		}
	}

	for _, excluded := range s.ExcludedDays {
		if _, err := time.Parse(time.DateOnly, excluded); err != nil {
			return fmt.Errorf("excluded day: %s is in invalid format", excluded)
		}
	}

	return nil
}

type StudentResponse struct {
	*db.Student
}

func NewStudentResponse(student *db.Student) *StudentResponse {
	return &StudentResponse{Student: student}
}

func (s *StudentResponse) Render(w http.ResponseWriter, r *http.Request) error {
	return nil
}

func NewStudentListResponse(students []*db.Student) []render.Renderer {
	list := []render.Renderer{}
	for _, student := range students {
		list = append(list, NewStudentResponse(student))
	}
	return list
}

func (rs *studentResource) StudentCtx(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		studentIDStr := chi.URLParam(r, "studentID")
		if studentIDStr == "" {
			render.Render(w, r, ErrInvalidRequest(errors.New("student id is missing")))
			return
		}

		studentID, err := strconv.Atoi(studentIDStr)
		if err != nil {
			render.Render(w, r, ErrInvalidRequest(err))
			return
		}

		student, err := rs.store.FindStudentByID(r.Context(), studentID)
		if err != nil {
			render.Render(w, r, ErrNotFound())
			return
		}

		ctx := context.WithValue(r.Context(), studentContextKey, student)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (rs *studentResource) List(w http.ResponseWriter, r *http.Request) {
	students, err := rs.store.ListStudents(r.Context(), false)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	render.RenderList(w, r, NewStudentListResponse(students))
}

func (rs *studentResource) FindOne(w http.ResponseWriter, r *http.Request) {
	student, ok := r.Context().Value(studentContextKey).(*db.Student)
	if !ok {
		render.Render(w, r, ErrInternal(errors.New("context error")))
		return
	}

	render.Render(w, r, NewStudentResponse(student))
}

func (rs *studentResource) Update(w http.ResponseWriter, r *http.Request) {
	currentStudent, ok := r.Context().Value(studentContextKey).(*db.Student)
	if !ok {
		render.Render(w, r, ErrInternal(errors.New("context error")))
		return
	}

	data := &StudentRequest{}
	if err := render.Bind(r, data); err != nil {
		render.Render(w, r, ErrInvalidRequest(err))
		return
	}

	currentStudent.UID = data.UID
	currentStudent.Name = data.Name
	currentStudent.Status = data.Status
	currentStudent.StartDate = data.StartDate
	currentStudent.EndDate = data.EndDate
	currentStudent.Schedule = data.Schedule
	currentStudent.DoneSeconds = data.DoneSeconds
	currentStudent.ExcludedDays = data.ExcludedDays
	currentStudent.BreakTime = data.BreakTime

	if err := rs.store.UpdateStudent(r.Context(), currentStudent); err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	bytes, err := json.Marshal(currentStudent)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	rs.hub.Broadcast(websockets.Event{
		Event:   "student:update",
		Payload: bytes,
	})

	render.Render(w, r, NewStudentResponse(currentStudent))
}

func (rs *studentResource) ListArchived(w http.ResponseWriter, r *http.Request) {
	students, err := rs.store.ListStudents(r.Context(), true)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	render.RenderList(w, r, NewStudentListResponse(students))
}

func (rs *studentResource) Archive(w http.ResponseWriter, r *http.Request) {
	student, ok := r.Context().Value(studentContextKey).(*db.Student)
	if !ok {
		render.Render(w, r, ErrInternal(errors.New("context error")))
		return
	}

	err := rs.store.ArchiveStudentByID(r.Context(), student.ID)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	bytes, err := json.Marshal(student)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	rs.hub.Broadcast(websockets.Event{
		Event:   "student:archive",
		Payload: bytes,
	})

	render.Render(w, r, NewStudentResponse(student))
}

func (rs *studentResource) Unarchive(w http.ResponseWriter, r *http.Request) {
	student, ok := r.Context().Value(studentContextKey).(*db.Student)
	if !ok {
		render.Render(w, r, ErrInternal(errors.New("context error")))
		return
	}

	err := rs.store.UnarchiveStudentByID(r.Context(), student.ID)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	bytes, err := json.Marshal(student)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	rs.hub.Broadcast(websockets.Event{
		Event:   "student:unarchive",
		Payload: bytes,
	})

	render.Render(w, r, NewStudentResponse(student))
}

func (rs *studentResource) Delete(w http.ResponseWriter, r *http.Request) {
	student, ok := r.Context().Value(studentContextKey).(*db.Student)
	if !ok {
		render.Render(w, r, ErrInternal(errors.New("context error")))
		return
	}

	err := rs.store.DeleteStudentByID(r.Context(), student.ID)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	// TODO: ws event if needed

	render.Render(w, r, NewStudentResponse(student))
}
