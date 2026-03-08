package repository

import (
	"database/sql"
	"errors"
	"strings"
	"time"

	"backend/models"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type Userepository struct {
	Db *sql.DB
}

func NewUserRepository(database *sql.DB) *Userepository {
	return &Userepository{Db: database}
}

func (r *Userepository) CreateUser(user models.User) error {
	query := "INSERT INTO users (firstname, lastname, username, age, gender, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)"
	user.Email = strings.ToLower(strings.TrimSpace(user.Email))
	user.Nickname = strings.ToLower(strings.TrimSpace(user.Nickname))
	_, err := r.Db.Exec(query, user.Firstname, user.Lastname, user.Nickname, user.Age, user.Gender, user.Email, user.Password)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			if strings.Contains(err.Error(), "email") {
				return errors.New("email already exists")
			} else if strings.Contains(err.Error(), "username") {
				return errors.New("username already exists")
			}
		}
		return err
	}
	return nil
}

func (r *Userepository) GetUserId(user models.LoginRequest) (int, error) {
	var userID int
	var hashedPassword string
	query := "SELECT id, password FROM users WHERE email = ? OR username = ? LIMIT 1"
	err := r.Db.QueryRow(query, user.Username, user.Username).Scan(&userID, &hashedPassword)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, errors.New("user not found")
		}
		return 0, err
	}
	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(user.Password))
	if err != nil {
		return 0, errors.New("invalid password")
	}
	return userID, nil
}

func (r *Userepository) CreateSession(userID int) (*models.Session, error) {
	var userSession models.Session
	userSession.UserID = userID
	userSession.Token = uuid.NewString()
	userSession.ExpiresAt = time.Now().Add(1 * time.Hour)
	query := "INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)"
	_, err := r.Db.Exec(query, userID, userSession.Token, userSession.ExpiresAt)
	if err != nil {
		return nil, err
	}
	return &userSession, nil
}

func (r *Userepository) ValidateSession(token string) (*models.Session, error) {
	var session models.Session

	query := "SELECT user_id, token, expires_at FROM sessions WHERE token = ? LIMIT 1"
	err := r.Db.QueryRow(query, token).Scan(&session.UserID, &session.Token, &session.ExpiresAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("session not found")
		}
		return nil, err
	}
	if session.ExpiresAt.Before(time.Now()) {
		_, err := r.Db.Exec("DELETE FROM sessions WHERE token = ?", session.Token)
		if err != nil {
			return nil, errors.New("server error")
		}
		return nil, errors.New("session expired")
	}
	return &session, nil
}
