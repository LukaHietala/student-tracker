package auth

import (
	"net/http"

	"github.com/go-chi/jwtauth/v5"
	"github.com/lestrrat-go/jwx/v3/jwt"
)

func (a *Auth) RejectAuthenticated(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token, _, err := jwtauth.FromContext(r.Context())
		if err != nil || token == nil {
			next.ServeHTTP(w, r)
			return
		}

		if err := jwt.Validate(token); err == nil {
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (a *Auth) LoggedInRedirector(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token, _, _ := jwtauth.FromContext(r.Context())

		count, err := a.store.TeacherCount()

		if count == 0 && err == nil {
			http.Redirect(w, r, "/onboarding", 302)
			return
		}

		if token != nil && jwt.Validate(token) == nil {
			http.Redirect(w, r, "/", 302)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (a *Auth) UnloggedInRedirector(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token, claims, err := jwtauth.FromContext(r.Context())

		if token == nil || err != nil {
			resetJWTCookies(w)
			http.Redirect(w, r, "/login", 302)
			return
		}

		if err := jwt.Validate(token); err != nil {
			resetJWTCookies(w)
			http.Redirect(w, r, "/login", 302)
			return
		}

		teacherIDFloat, ok := claims["teacher_id"].(float64)
		if !ok {
			resetJWTCookies(w)
			http.Redirect(w, r, "/login", 302)
			return
		}

		teacher, err := a.store.FindTeacherByID(r.Context(), int(teacherIDFloat))

		if err != nil {
			resetJWTCookies(w)
			http.Redirect(w, r, "/login", 302)
			return
		}

		if teacher == nil {
			resetJWTCookies(w)
			http.Redirect(w, r, "/login", 302)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (a *Auth) OnboardingRedirector(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		count, _ := a.store.TeacherCount()

		if count > 0 {
			http.Redirect(w, r, "/", 302)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func resetJWTCookies(w http.ResponseWriter) {
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
