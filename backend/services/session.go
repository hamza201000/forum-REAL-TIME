package services

import (
	"backend/models"
	"context"
	"fmt"
)

type contextKey string

const sessionKey contextKey = "session"

func WithSession(ctx context.Context, session *models.Session) context.Context {

	return context.WithValue(ctx, sessionKey, session)
}

func GetSession(ctx context.Context) (*models.Session, bool) {
	session, ok := ctx.Value(sessionKey).(*models.Session)
	fmt.Println(session)
	return session, ok
}

type UserSession struct {
	Session *models.Session
}

func NewUserSession(DataSession *models.Session) *UserSession {
	return &UserSession{Session: DataSession}
}
