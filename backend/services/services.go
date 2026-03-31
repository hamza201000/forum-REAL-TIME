package services

import (
	"errors"
	"fmt"

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
	hashPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("failed to hash password")
	}
	user.Password = string(hashPassword)
	return s.Repo.CreateUser(user)
}

func (s *UserService) LoginUser(data models.LoginRequest) (int, string, error) {
	if data.Username == "" {
		return 0, "", errors.New("email or username is required")
	}
	if data.Password == "" {
		return 0, "", errors.New("password is required")
	}
	userID,username, err := s.Repo.GetUserId(data)
	if err != nil {
		fmt.Println(err)
		return 0, "", err
	}
	return userID,username, nil
}



