package models

import (
	"time"
)

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
	Id        int   `jason:"id"`
	UserID    int   `jason:"useriD"`
	Username  string `jason:"username"`
	Token     string  `jason:"token"`
	CreatedAt time.Time `jason:"createat"`
	ExpiresAt time.Time `jason:"expiresat"`
	MessagePong string `json:"messagePong"`
}

type LoginRequest struct {
	Username string `json:"user"`
	Password string `json:"password"`
}

type Post struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Username string   `json:"username"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}
