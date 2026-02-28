package services

import (
	"time"

	"backend/models"
)

type UserSession struct {
	Session *models.Session
}

func NewDataSession(DataSession *models.Session) *UserSession {
	return &UserSession{Session: DataSession}
}

func (s *UserSession) NewSession() bool {
	s.Session.createdAt = time.Now()
	s.Session.ExpiresAt = s.Session.createdAt.Add(24 * time.Hour)
	return true
}
