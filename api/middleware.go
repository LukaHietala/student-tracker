package api

import (
	"net/http"

	"github.com/go-chi/jwtauth/v5"
	"github.com/lestrrat-go/jwx/v3/jwt"
)

func ResetJWTCookies(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		HttpOnly: true,
		MaxAge:   -1,
		SameSite: http.SameSiteLaxMode,
		// Uncomment below for HTTPS:
		// Secure: true,
		Name:  "jwt",
		Value: "",
	})
}

func LoggedInRedirector(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token, _, _ := jwtauth.FromContext(r.Context())

		count, err := store.TeacherCount()

		if count == 0 && err == nil {
			http.Redirect(w, r, "/onboarding", 302)
			return
		}

		if token != nil && jwt.Validate(token) == nil {
			http.Redirect(w, r, "/", 302)
		}

		next.ServeHTTP(w, r)
	})
}

func UnloggedInRedirector(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token, claims, err := jwtauth.FromContext(r.Context())

		if token == nil || err != nil {
			ResetJWTCookies(w)
			http.Redirect(w, r, "/login", 302)
			return
		}

		if err := jwt.Validate(token); err != nil {
			ResetJWTCookies(w)
			http.Redirect(w, r, "/login", 302)
			return
		}

		teacherIDFloat, ok := claims["teacher_id"].(float64)
		if !ok {
			ResetJWTCookies(w)
			http.Redirect(w, r, "/login", 302)
			return
		}

		teacher, err := store.FindTeacherByID(r.Context(), int(teacherIDFloat))

		if err != nil {
			ResetJWTCookies(w)
			http.Redirect(w, r, "/login", 302)
			return
		}

		if teacher == nil {
			ResetJWTCookies(w)
			http.Redirect(w, r, "/login", 302)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func AdminOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		count, err := store.TeacherCount()

		// TODO: Make secure
		if count == 0 && err == nil {
			return
		}

		token, claims, _ := jwtauth.FromContext(r.Context())

		if token == nil || jwt.Validate(token) != nil {
			http.Error(w, http.StatusText(403), 403)
			return
		}

		teacherIDFloat, ok := claims["teacher_id"].(float64)
		if !ok {
			http.Error(w, http.StatusText(403), 403)
			return
		}

		teacher, err := store.FindTeacherByID(r.Context(), int(teacherIDFloat))

		if err != nil {
			http.Error(w, http.StatusText(403), 403)
			return
		}

		if teacher == nil {
			http.Error(w, http.StatusText(403), 403)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func OnboardingRedirector(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		count, _ := store.TeacherCount()

		if count > 0 {
			http.Redirect(w, r, "/", 302)
			return
		}

		next.ServeHTTP(w, r)
	})
}
