package middleware

import (
	"fmt"
	"net/http"

	"backend/models"
	"backend/services"
)

func AuthMiddleware(next http.Handler, svc *services.UserService) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("session_token")
		if err != nil || cookie.Value == "" {
			// services.SenData(w, "error", "Unauthorized", http.StatusSeeOther)
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}
		sessionToken := cookie.Value
		session, err := svc.Repo.ValidateSession(sessionToken)
		if err != nil || session == nil {
			ClearSessionCookie(w)
			services.SenData(w, "error", "Unauthorized", http.StatusUnauthorized)
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}
		fmt.Println(session.UserID, session.CreatedAt, "you have a ssesion")
		r = r.WithContext(services.WithSession(r.Context(), session))
		next.ServeHTTP(w, r)
	})
}

func ClearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:   "session_id",
		Value:  "",
		Path:   "/",
		MaxAge: -1,
	})
}

func SetSessionCookie(session *models.Session, w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    session.Token,
		Path:     "/",
		Expires:  session.ExpiresAt,
		HttpOnly: true,
		MaxAge:   3600, // 1 hours
	})

}
