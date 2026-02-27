package repository

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"strings"

	"backend/models"
)

type Userepository struct {
	Db *sql.DB
}

func NewUserRepository(database *sql.DB) *Userepository {
	return &Userepository{Db: database}
}

func (r *Userepository) CreateUser(user models.User) error {
	query := "INSERT INTO users (firstname, lastname, username, age, gender, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)"

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

func GenerateToken() string {
	bytes := make([]byte, 32)
	_, err := rand.Read(bytes)
	if err != nil {
		return ""
	}
	return hex.EncodeToString(bytes)
}

func (r *Userepository) CreateSession(session models.Session) error {
	var userID int
	err := r.Db.QueryRow("SELECT id FROM users WHERE email = ?", session.UserID).Scan(&userID)
	if err != nil {
		return errors.New("user not found")
	}
	session.UserID = userID
	query := "INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)"
	_, err = r.Db.Exec(query, session.UserID, session.Token, session.ExpiresAt)
	return err
}
