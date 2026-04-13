package repository

import (
	"database/sql"
	"errors"
	"fmt"
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

func (r *Userepository) GetUserId(user models.LoginRequest) (int, string, error) {
	var userID int
	var hashedPassword string
	var username string
	query := "SELECT id, password, username FROM users WHERE email = ? OR username = ? LIMIT 1"
	err := r.Db.QueryRow(query, user.Username, user.Username).Scan(&userID, &hashedPassword, &username)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, "", errors.New("user not found")
		}
		return 0, "", err
	}
	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(user.Password))
	if err != nil {
		return 0, "", errors.New("invalid password")
	}
	return userID, username, nil
}

func (r *Userepository) CreateSession(userID int, username string) (*models.Session, error) {
	var userSession models.Session
	userSession.UserID = userID
	userSession.Username = username
	userSession.Token = uuid.NewString()
	userSession.ExpiresAt = time.Now().Add(1 * time.Hour)
	query := "INSERT INTO sessions (user_id, username, token, expires_at) VALUES (?, ?, ?, ?)"
	_, err := r.Db.Exec(query, userID, userSession.Username, userSession.Token, userSession.ExpiresAt)
	if err != nil {
		return nil, err
	}
	return &userSession, nil
}

func (r *Userepository) ValidateSession(token string) (*models.Session, error) {
	var session models.Session
	query := "SELECT user_id, username, token, created_at, expires_at FROM sessions WHERE token = ? LIMIT 1"
	err := r.Db.QueryRow(query, token).Scan(&session.UserID, &session.Username, &session.Token, &session.CreatedAt, &session.ExpiresAt)
	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Println(err)
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

func (r *Userepository) DeleteSession(token string) error {
	_, err := r.Db.Exec("DELETE FROM sessions WHERE token = ?", token)
	if err != nil {
		return err
	}
	return nil
}

func (r *Userepository) CreatePost(post models.Post) error {
	query := "INSERT INTO posts (user_id,username, title, content) VALUES (?, ?, ?, ?)"
	_, err := r.Db.Exec(query, post.UserID, post.Username, post.Title, post.Content)
	if err != nil {
		fmt.Println(err)
		return err
	}
	return nil
}

func (r *Userepository) GetAllPost(userID int) ([]models.Post, error) {
	var posts []models.Post
	query := `SELECT p.id, p.user_id, p.username, p.title, p.content, p.created_at,
                    COUNT(l.user_id) as like_count,
                    CASE WHEN EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id) THEN 1 ELSE 0 END as is_liked
             FROM posts p
             LEFT JOIN likes l ON p.id = l.post_id
             GROUP BY p.id
             ORDER BY p.created_at DESC`
	rows, err := r.Db.Query(query,userID)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {

		var post models.Post
		var isLiked int
		err = rows.Scan(&post.ID, &post.UserID, &post.Username, &post.Title, &post.Content, &post.CreatedAt, &post.LikeCount, &isLiked)
		if err != nil {
			return nil, err
		}
		post.IsLiked = isLiked == 1
		posts = append(posts, post)
	}
	return posts, nil
}

func (r *Userepository) GetAllUsers(userid int) ([]models.Client, error) {
	var Users []models.Client
	query := "SELECT id ,username FROM users"
	rows, err := r.Db.Query(query)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var user models.Client
		user.LastMsg = &models.DataMessage{}
		err = rows.Scan(&user.User_id, &user.Username)
		if user.User_id == userid {
			continue
		}
		query = "SELECT id, sender_id, receiver_id,username_sender, content, seen FROM conversation WHERE (sender_id = ? AND receiver_id = ? ) OR (sender_id = ? AND receiver_id = ?) ORDER BY id DESC LIMIT 1"
		err = r.Db.QueryRow(query, userid, user.User_id, user.User_id, userid).Scan(&user.LastMsg.Id, &user.LastMsg.Sender_id, &user.LastMsg.Receiver_id, &user.LastMsg.Username_sender, &user.LastMsg.Message, &user.LastMsg.Seen)
		if err != nil {
			if err == sql.ErrNoRows {
				user.LastMsg = nil
			} else {
				fmt.Println(err)
				return nil, err
			}
		}

		Users = append(Users, user)
	}
	return Users, nil
}
func (r *Userepository) InsertSeenMessage(ReciverID, SenderId int) error {
	query := "UPDATE conversation SET seen = 1 WHERE receiver_id = ? AND sender_id = ?"
	_, err := r.Db.Exec(query, ReciverID, SenderId)
	if err != nil {
		return err
	}
	return nil
}

// IF SEEN = 0 MEANS NOT SEEN, IF SEEN = 1 MEANS SEEN, SO I UPDATE IT TO 0 WHEN THE RECEIVER GET THE MESSAGE, AND IN FRONTEND WHEN I GET MESSAGES I CHECK IF SEEN = 0 I RENDER IT AS UNSEEN MESSAGE, IF SEEN = 1 I RENDER IT AS SEEN MESSAGE
func (r *Userepository) InsertMessage(message models.DataMessage) (int, error) {
	query := "INSERT INTO conversation (sender_id, receiver_id,username_sender, content) VALUES (?,?, ?, ?) RETURNING id"
	var messageID int
	err := r.Db.QueryRow(query, message.Sender_id, message.Receiver_id, message.Username_sender, message.Message).Scan(&messageID)
	if err != nil {
		return 0, err
	}
	return messageID, nil
}

func (r *Userepository) GetMessages(lastMsgID int, userID int, targetID int) ([]models.DataMessage, error) {
	var messages []models.DataMessage
	query := `SELECT sender_id, receiver_id,username_sender, content FROM conversation
	 WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) 
	 AND id > ? ORDER BY id DESC LIMIT 10`
	rows, err := r.Db.Query(query, userID, targetID, targetID, userID, lastMsgID)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var message models.DataMessage
		err = rows.Scan(&message.Sender_id, &message.Receiver_id, &message.Username_sender, &message.Message)
		if err != nil {
			fmt.Println(err)
			return nil, err
		}
		messages = append(messages, message)
	}
	return messages, nil
}

func (r *Userepository) UpdateUserStatus(userID int, isOnline bool) error {
	query := "UPDATE users SET is_online = ? WHERE id = ?"
	_, err := r.Db.Exec(query, isOnline, userID)
	if err != nil {
		return err
	}
	return nil
}

func (r *Userepository) GetUserStatus(userID int) (bool, error) {
	var isOnline bool
	query := "SELECT is_online FROM users WHERE id = ?"
	err := r.Db.QueryRow(query, userID).Scan(&isOnline)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil // Default to offline if no status found
		}
		return false, err
	}
	return isOnline, nil
}

// ////////////////////////
// /likes repository///////
// ////////////////////////
// AddLike adds a like to a post by a user
func (r *Userepository) AddLike(userID int, postID int) error {
	query := "INSERT INTO likes (user_id, post_id) VALUES (?, ?)"
	_, err := r.Db.Exec(query, userID, postID)
	return err
}

func (r *Userepository) RemoveLike(userID int, postID int) error {
	query := "DELETE FROM likes WHERE user_id = ? AND post_id = ?"
	_, err := r.Db.Exec(query, userID, postID)
	return err
}

// IsPostLikedByUser checks if a post is liked by a specific user
func (r *Userepository) IsPostLikedByUser(userID int, postID int) (bool, error) {
	query := "SELECT COUNT(*) FROM likes WHERE user_id = ? AND post_id = ?"
	var count int
	err := r.Db.QueryRow(query, userID, postID).Scan(&count)
	return count > 0, err
}

// GetPostLikeCount returns the total number of likes for a specific post
func (r *Userepository) GetPostLikeCount(postID int) (int, error) {
	query := "SELECT COUNT(*) FROM likes WHERE post_id = ?"
	var count int
	err := r.Db.QueryRow(query, postID).Scan(&count)
	return count, err
}
