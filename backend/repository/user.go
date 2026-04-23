package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
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

func (u *Userepository) DeleteFromDB() error {
	qur := "DELETE FROM users WHERE id = 1"
	res, err := u.Db.Exec(qur)
	if err != nil {
		return err
	}
	rows, _ := res.RowsAffected()
	log.Printf("Rows deleted: %d", rows)
	return nil
}

func (r *Userepository) CreateUser(user models.User) error {
	query := "INSERT INTO users (firstname, lastname, username, age, gender, email, password) VALUES (?, ?, ?, ?, ?, ?, ?) "
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
	user.Username = strings.ToLower(strings.TrimSpace(user.Username))
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

func (r *Userepository) CheckUserSession(userID int) error {
	query := "DELETE FROM sessions WHERE user_id = ?"
	_, err := r.Db.Exec(query, userID)
	if err != nil {
		return err
	}
	return nil
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
	query := "INSERT INTO posts (user_id,username, title, content, category) VALUES (?, ?, ?, ?, ?)"
	_, err := r.Db.Exec(query, post.UserID, post.Username, post.Title, post.Content, post.Category)
	if err != nil {
		fmt.Println(err)
		return err
	}
	return nil
}

func (r *Userepository) GetAllPost(userId int) ([]models.Post, error) {
	var posts []models.Post
	query := `SELECT 
    p.id,
    p.user_id,
    p.username,
    p.title,
    p.content,
    p.category,
    p.created_at,

    (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS allLikes,

    (SELECT COUNT(*) 
     FROM likes l 
     WHERE l.post_id = p.id AND l.user_id = ?) AS LikeUsr

FROM posts p
ORDER BY p.created_at DESC;`
	rows, err := r.Db.Query(query, userId)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var post models.Post
		err = rows.Scan(&post.ID, &post.UserID, &post.Username, &post.Title, &post.Content,
			&post.Category, &post.CreatedAt, &post.AllLikes, &post.LikeUsr)
		if err != nil {
			return nil, err
		}
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
	var rows *sql.Rows
	var err error
	if lastMsgID == 0 {
		rows, err = r.Db.Query(`
        SELECT id, sender_id, receiver_id,username_sender, content,created_at FROM conversation
        WHERE (sender_id = ? AND receiver_id = ?
           OR sender_id = ? AND receiver_id = ?)
        ORDER BY id DESC
        LIMIT 10
    `, userID, targetID, targetID, userID, lastMsgID)
	} else {
		rows, err = r.Db.Query(`
        SELECT id, sender_id, receiver_id,username_sender, content,created_at FROM conversation
        WHERE (sender_id = ? AND receiver_id = ?
           OR sender_id = ? AND receiver_id = ?)
        AND id < ?
        ORDER BY id DESC
        LIMIT 10
    `, userID, targetID, targetID, userID, lastMsgID)
	}
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var message models.DataMessage
		err = rows.Scan(&message.Id, &message.Sender_id, &message.Receiver_id, &message.Username_sender, &message.Message, &message.CreatedAt)
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

func (r *Userepository) LikePost(postID int, userID int) error {
	query := "INSERT INTO likes (post_id, user_id) VALUES (?, ?)"
	_, err := r.Db.Exec(query, postID, userID)
	if err != nil {
		fmt.Println(err)
		if strings.Contains(err.Error(), "UNIQUE") {
			query := "DELETE FROM likes WHERE post_id = ? AND user_id = ?"
			_, err := r.Db.Exec(query, postID, userID)
			if err != nil {
				return err
			}
			return nil
		}
		return err
	}
	return nil
}

func (r *Userepository) AddComment(postID int, userID int, username string, content string) error {
	query := "INSERT INTO comments (post_id, user_id, username, content) VALUES (?, ?, ?, ?)"
	_, err := r.Db.Exec(query, postID, userID, username, content)
	if err != nil {
		return err
	}
	return nil
}

func (r *Userepository) GetComments(postID int) ([]models.Comment, error) {
	var comments []models.Comment
	query := "SELECT id, user_id, username, content, created_at FROM comments WHERE post_id = ? ORDER BY created_at ASC"
	rows, err := r.Db.Query(query, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var comment models.Comment
		err = rows.Scan(&comment.ID, &comment.UserID, &comment.Username, &comment.Content, &comment.CreatedAt)
		if err != nil {
			return nil, err
		}
		comments = append(comments, comment)
	}
	return comments, nil
}
