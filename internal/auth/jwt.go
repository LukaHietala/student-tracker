package auth

import (
	"net/http"
	"time"

	"github.com/go-chi/jwtauth/v5"
	"github.com/lestrrat-go/jwx/v3/jwt"
	"github.com/lukahietala/rfid/internal/db"
)

type Auth struct {
	token *jwtauth.JWTAuth
	store *db.Store
}

func New(secret string, store *db.Store) *Auth {
	return &Auth{
		token: jwtauth.New("HS256", []byte(secret), nil, jwt.WithAcceptableSkew(30*time.Second)),
		store: store,
	}
}

func (a *Auth) MakeSessionToken(teacherID int) (string, error) {
	claims := map[string]any{
		"teacher_id": teacherID,
	}
	// TODO: Refresh tokens :(
	jwtauth.SetExpiryIn(claims, 24*28*time.Hour)
	jwtauth.SetIssuedNow(claims)

	_, tokenStr, err := a.token.Encode(claims)
	if err != nil {
		return "", err
	}

	return tokenStr, nil
}

func (a *Auth) Verifier() func(http.Handler) http.Handler {
	return jwtauth.Verifier(a.token)
}

func (a *Auth) Authenticator() func(http.Handler) http.Handler {
	return jwtauth.Authenticator(a.token)
}
