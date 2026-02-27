package models

import "time"

type User struct {
	Id        int
	Firstname string `json:"firstname"`
	Lastname  string `json:"lastname"`
	Nickname  string `json:"nickname"`
	Age       string `json:"age"`
	Gender    string `json:"gender"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	CreatedAt time.Time
}

type Session struct {
	Id        int
	UserID    int
	Token     string
	createdAt time.Time
	ExpiresAt time.Time
}
