package api

import (
	"time"

	"github.com/go-chi/jwtauth/v5"
)

var tokenAuth *jwtauth.JWTAuth

func InitAuth(secret string) {
	tokenAuth = jwtauth.New("HS256", []byte(secret), nil)
}

func MakeSessionToken(teacherID int) string {
	claims := map[string]any{
		"teacher_id": teacherID,
	}
	jwtauth.SetExpiryIn(claims, 24*31*time.Hour)
	jwtauth.SetIssuedNow(claims)
	_, token, _ := tokenAuth.Encode(claims)
	return token
}
