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

type groupResource struct {
	store *db.Store
	auth  *auth.Auth
}

func NewGroupResource(s *db.Store, a *auth.Auth) *groupResource {
	return &groupResource{store: s, auth: a}
}

func (rs *groupResource) Routes() chi.Router {
	r := chi.NewRouter()
	r.Use(rs.auth.Authenticator())

	r.Get("/", rs.List)
	r.Post("/", rs.Create)
	r.Route("/{groupID}", func(r chi.Router) {
		r.Use(rs.GroupCtx)
		r.Get("/", rs.FindOne)
		r.Put("/", rs.Update)
		r.Delete("/", rs.Archive)
		r.Route("/students", func(r chi.Router) {
			r.Get("/", rs.ListStudents)
			r.Get("/archived", rs.ListArchivedStudents)
			r.Post("/", rs.CreateStudent)
		})
	})

	r.Route("/archive", func(r chi.Router) {
		r.Get("/", rs.ListArchived)
		r.Route("/{groupID}", func(r chi.Router) {
			r.Use(rs.GroupCtx)
			r.Delete("/", rs.Delete)
		})
	})

	return r
}

type GroupRequest struct {
	Name string `json:"name"`
}

func (g *GroupRequest) Bind(r *http.Request) error {
	g.Name = strings.TrimSpace(g.Name)

	if g.Name == "" {
		return errors.New("group name is required")
	}
	if utf8.RuneCountInString(g.Name) > 50 {
		return errors.New("group name is too long (max 50)")
	}

	return nil
}

type GroupResponse struct {
	*db.Group
}

func NewGroupResponse(group *db.Group) *GroupResponse {
	return &GroupResponse{Group: group}
}

func (g *GroupResponse) Render(w http.ResponseWriter, r *http.Request) error {
	return nil
}

func NewGroupListResponse(groups []*db.Group) []render.Renderer {
	list := []render.Renderer{}
	for _, group := range groups {
		list = append(list, NewGroupResponse(group))
	}
	return list
}

func (rs *groupResource) GroupCtx(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		groupIDStr := chi.URLParam(r, "groupID")
		if groupIDStr == "" {
			render.Render(w, r, ErrInvalidRequest(errors.New("group id is missing")))
			return
		}

		groupID, err := strconv.Atoi(groupIDStr)
		if err != nil {
			render.Render(w, r, ErrInvalidRequest(err))
			return
		}

		group, err := rs.store.FindGroupByID(r.Context(), groupID)
		if err != nil {
			render.Render(w, r, ErrNotFound())
			return
		}

		ctx := context.WithValue(r.Context(), groupContextKey, group)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (rs *groupResource) List(w http.ResponseWriter, r *http.Request) {
	groups, err := rs.store.ListGroups(r.Context(), false)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	render.RenderList(w, r, NewGroupListResponse(groups))
}

func (rs *groupResource) Create(w http.ResponseWriter, r *http.Request) {
	data := &GroupRequest{}
	if err := render.Bind(r, data); err != nil {
		render.Render(w, r, ErrInvalidRequest(err))
		return
	}

	newGroup := &db.Group{
		Name: data.Name,
	}

	if err := rs.store.AddGroup(r.Context(), newGroup); err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	render.Status(r, http.StatusCreated)
	render.Render(w, r, NewGroupResponse(newGroup))
}

func (rs *groupResource) FindOne(w http.ResponseWriter, r *http.Request) {
	group, ok := r.Context().Value(groupContextKey).(*db.Group)
	if !ok {
		render.Render(w, r, ErrInternal(errors.New("context error")))
		return
	}

	render.Render(w, r, NewGroupResponse(group))
}

func (rs *groupResource) Update(w http.ResponseWriter, r *http.Request) {
	currentGroup, ok := r.Context().Value(groupContextKey).(*db.Group)
	if !ok {
		render.Render(w, r, ErrInternal(errors.New("context error")))
		return
	}

	data := &GroupRequest{}
	if err := render.Bind(r, data); err != nil {
		render.Render(w, r, ErrInvalidRequest(err))
		return
	}

	currentGroup.Name = data.Name

	if err := rs.store.UpdateGroup(r.Context(), currentGroup); err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	render.Render(w, r, NewGroupResponse(currentGroup))
}

func (rs *groupResource) Archive(w http.ResponseWriter, r *http.Request) {
	group, ok := r.Context().Value(groupContextKey).(*db.Group)
	if !ok {
		render.Render(w, r, ErrInternal(errors.New("context error")))
		return
	}

	err := rs.store.ArchiveGroupByID(r.Context(), group.ID)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	render.Render(w, r, NewGroupResponse(group))
}

func (rs *groupResource) ListArchived(w http.ResponseWriter, r *http.Request) {
	groups, err := rs.store.ListGroups(r.Context(), true)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	render.RenderList(w, r, NewGroupListResponse(groups))
}

func (rs *groupResource) Delete(w http.ResponseWriter, r *http.Request) {
	group, ok := r.Context().Value(groupContextKey).(*db.Group)
	if !ok {
		render.Render(w, r, ErrInternal(errors.New("context error")))
		return
	}

	err := rs.store.DeleteGroupByID(r.Context(), group.ID)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	render.Render(w, r, NewGroupResponse(group))
}

func (rs *groupResource) ListStudents(w http.ResponseWriter, r *http.Request) {
	group, ok := r.Context().Value(groupContextKey).(*db.Group)
	if !ok {
		render.Render(w, r, ErrInternal(errors.New("context error")))
		return
	}

	students, err := rs.store.ListGroupStudents(r.Context(), false, group.ID)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	render.RenderList(w, r, NewStudentListResponse(students))
}

func (rs *groupResource) ListArchivedStudents(w http.ResponseWriter, r *http.Request) {
	group, ok := r.Context().Value(groupContextKey).(*db.Group)
	if !ok {
		render.Render(w, r, ErrInternal(errors.New("context error")))
		return
	}

	students, err := rs.store.ListGroupStudents(r.Context(), true, group.ID)
	if err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}
	render.RenderList(w, r, NewStudentListResponse(students))
}

func (rs *groupResource) CreateStudent(w http.ResponseWriter, r *http.Request) {
	group, ok := r.Context().Value(groupContextKey).(*db.Group)
	if !ok {
		render.Render(w, r, ErrInternal(errors.New("context error")))
		return
	}

	data := &StudentRequest{}
	if err := render.Bind(r, data); err != nil {
		render.Render(w, r, ErrInvalidRequest(err))
		return
	}

	newStudent := &db.Student{
		GroupID:      group.ID,
		UID:          data.UID,
		Name:         data.Name,
		Status:       data.Status,
		StartDate:    data.StartDate,
		EndDate:      data.EndDate,
		Schedule:     data.Schedule,
		DoneSeconds:  data.DoneSeconds,
		ExcludedDays: data.ExcludedDays,
		BreakTime:    data.BreakTime,
	}

	if err := rs.store.AddStudent(r.Context(), newStudent); err != nil {
		render.Render(w, r, ErrInternal(err))
		return
	}

	render.Status(r, http.StatusCreated)
	render.Render(w, r, NewStudentResponse(newStudent))
}
