package services

import (
	"context"
	"fmt"

	"backend/models"
)

func WithSession(ctx context.Context, session *models.Session) context.Context {
	return context.WithValue(ctx, "session", session)
}

func GetSession(ctx context.Context) (*models.Session, bool) {
	session, ok := ctx.Value("session").(*models.Session)
	fmt.Println(session)
	return session, ok
}

type UserSession struct {
	Session *models.Session
}

func NewUserSession(DataSession *models.Session) *UserSession {
	return &UserSession{Session: DataSession}
}
