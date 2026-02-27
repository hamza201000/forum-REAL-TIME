package services

import (
	"errors"
	"strings"

	"golang.org/x/crypto/bcrypt"

	"backend/models"
	"backend/repository"
)

type UserService struct {
	Repo *repository.Userepository
}

func NewUserService(repo *repository.Userepository) *UserService {
	return &UserService{Repo: repo}
}

func (s *UserService) RegisterUser(user models.User) error {
	if user.Firstname == "" || user.Lastname == "" || user.Nickname == "" ||
		user.Age == "" || user.Gender == "" || user.Email == "" || user.Password == "" {
		return errors.New("missing required fields")
	}

	if len(user.Password) < 8 {
		return errors.New("password must be at least 8 characters long")
	}
	user.Email = strings.ToLower(strings.TrimSpace(user.Email))
	hashPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("failed to hash password")
	}
	user.Password = string(hashPassword)
	return s.Repo.CreateUser(user)
}
