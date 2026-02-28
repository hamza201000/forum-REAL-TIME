package middleware

import (
	"net/http"

	"backend/models"
)

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("session_token")
		if err != nil || cookie.Value == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func ClearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:  "session_token",
		Value: "",
	})
}

type UserSession struct {
	Session *models.Session
}

func NewDataSession(DataSession *models.Session) *UserSession {
	return &UserSession{Session: DataSession}
}

func (u *UserSession) SetSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    u.Session.Token,
		Path:     "/",
		HttpOnly: true,
		MaxAge:   3600, // 1 hours
	})
}
