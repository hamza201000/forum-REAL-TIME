package models

import (
	"time"
)

type User struct {
	Id        int 
	Firstname string
	Lastname  string
	Nickname  string 
	Age       string
	Gender    string
	Email     string
	Password  string
	CreatedAt time.Time
}

type Session struct {
	Id          int       `json:"id"`
	UserID      int       `json:"useriD"`
	Username    string    `json:"username"`
	Token       string    `json:"token"`
	CreatedAt   time.Time `json:"createat"`
	ExpiresAt   time.Time `json:"expiresat"`
	MessagePong string    `json:"messagePong"`
}

type LoginRequest struct {
	Username string `json:"user"`
	Password string `json:"password"`
}

type Post struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Username  string    `json:"username"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type Client struct {
	User_id        int `json:"User_id"`
	Username  string `json:"Username"`
}


type DataMessage struct {
	Username_sender string  
	Sender_id int 
	Receiver_id     int    `json:"Receiver_id"`
	Message string `json:"Message"`
}

// type DataConversation struct{

	



// }