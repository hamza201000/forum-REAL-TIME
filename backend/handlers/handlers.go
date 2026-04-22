package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"

	"backend/middleware"
	"backend/models"
	"backend/services"
)

func HomeHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			fmt.Println("home handler", r.Method)
			return
		}
		content, err := os.ReadFile("../frontend/public/index.html")
		if err != nil {
			http.Error(w, "Not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "text/html")
		w.Write(content)
	}
}

func RegisterHandler(svc *services.UserService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var data models.User
		err := json.NewDecoder(r.Body).Decode(&data)
		if err != nil {
			fmt.Println(err)
			return
		}
		err = svc.RegisterUser(data)
		if err != nil {
			fmt.Println(err)
			if strings.Contains(err.Error(), "email") {
				services.SenData(w, "error", "Email already exists", http.StatusConflict) // 409
				return
			}
			if strings.Contains(err.Error(), "username") {
				services.SenData(w, "error", "Username already exists", http.StatusConflict)
				return
			}
			services.SenData(w, "error", "Failed to register user", http.StatusInternalServerError)
			return
		}
		broadcastNewUsers()
		services.SenData(w, "message", "User registered successfully", http.StatusOK)
	}
}

func LoginHandler(svc *services.UserService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			return
		}
		var data models.LoginRequest
		err := json.NewDecoder(r.Body).Decode(&data)
		if err != nil {
			services.SenData(w, "error", "Invalid request body", http.StatusBadRequest)
			return
		}
		userID, username, err := svc.LoginUser(data)
		if err != nil {
			if strings.Contains(err.Error(), "user not found") {
				services.SenData(w, "error", "User not found", http.StatusNotFound)
				return
			}
			if strings.Contains(err.Error(), "invalid password") {
				services.SenData(w, "error", "Invalid password", http.StatusUnauthorized)
				return
			}
			services.SenData(w, "error", "Failed to login user", http.StatusInternalServerError)
			return
		}
		check := checkOnlineUser(userID)
		if check {
			for _, conn := range clients[userID] {
				conn.Close()
			}
			delete(clients, userID)
		}
		err = svc.Repo.CheckUserSession(userID)
		if err != nil {
			services.SenData(w, "error", "Failed to check user session", http.StatusInternalServerError)
			return
		}
		session, err := svc.Repo.CreateSession(userID, username)
		if err != nil {
			services.SenData(w, "error", "Failed to create session", http.StatusInternalServerError)
			return
		}
		middleware.SetSessionCookie(session, w)
		broadcastOnlineUsers()
		services.SenData(w, "message", "User logged in successfully", http.StatusOK)
	}
}

func SessionHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		session, _ := services.GetSession(r.Context())
		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"userID":    session.UserID,
			"username":  session.Username,
			"expiresAt": session.ExpiresAt,
		})
	})
}

func LogoutHandler(svc *services.UserService) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, _ := r.Cookie("session_token")
		session, _ := svc.Repo.ValidateSession(cookie.Value)
		delete(clients, session.UserID)
		broadcastOnlineUsers()
		svc.Repo.DeleteSession(cookie.Value)
		middleware.ClearSessionCookie(w)
		services.SenData(w, "message", "User logged out successfully", http.StatusOK)
	})
}

func PostsHandler(svc *services.UserService) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			services.SenData(w, "error", "Method not allowed. Use POST", http.StatusMethodNotAllowed)
			return
		}
		var data models.Post
		err := json.NewDecoder(r.Body).Decode(&data)
		if err != nil {
			services.SenData(w, "error", "Invalid request body", http.StatusBadRequest)
			return
		}
		ctx := r.Context()
		session, ok := services.GetSession(ctx)
		if !ok {
			fmt.Println(ok)
			return
		}
		data.UserID = session.UserID
		data.Username = session.Username
		err = svc.CheckDataPost(data)
		if err != nil {
			fmt.Println(err)
			services.SenData(w, "error", err.Error(), http.StatusBadRequest)
			return
		}
		services.SenData(w, "message", "Post created successfully", http.StatusOK)
	})
}

func GetPost(svc *services.UserService) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cntx := r.Context()
		session, ok := services.GetSession(cntx)
		if !ok {
			fmt.Println(ok)
			return
		}
		posts, err := svc.Repo.GetAllPost(session.UserID)
		if err != nil {
			services.SenData(w, "message", "Intarnal server error", http.StatusInternalServerError)
			return
		}
		services.SenData(w, "allpost", posts, http.StatusOK)
	})
}

func GetAllUsers(svc *services.UserService) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		session, ok := services.GetSession(r.Context())
		if !ok {
			LogoutHandler(svc)
			return
		}
		Users, err := svc.Repo.GetAllUsers(session.UserID)
		if err != nil {
			services.SenData(w, "message", "Intarnal servre", http.StatusInternalServerError)
			return
		}
		services.SenData(w, "allusers", Users, http.StatusOK)
	})
}

func GetMessages(svc *services.UserService) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var msg models.Loadmsg
		err := json.NewDecoder(r.Body).Decode(&msg)
		if err != nil {
			fmt.Println(err)
			services.SenData(w, "error", "Invalid request body", http.StatusBadRequest)
			return
		}
		ctx := r.Context()
		session, ok := services.GetSession(ctx)
		if !ok {
			return
		}
		AllMessages, err := svc.Repo.GetMessages(msg.LastMsg, session.UserID, msg.UserID)
		if err != nil {
			broadcastOnlineUsers()
			fmt.Println(err)
			return
		}
		services.SenData(w, "allmessages", AllMessages, http.StatusOK)
	})
}

func LikeHandler(svc *services.UserService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, ok := services.GetSession(r.Context())
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		var likeData models.Like
		err := json.NewDecoder(r.Body).Decode(&likeData)
		if err != nil {
			fmt.Println(err)
			http.Error(w, "Bad Request", http.StatusBadRequest)
			return
		}
		err = svc.Repo.LikePost(likeData.PostID, session.UserID)
		if err != nil {
			fmt.Println(err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		services.SenData(w, "message", "Like created successfully", http.StatusOK)
	}
}

func CommentHandler(svc *services.UserService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, ok := services.GetSession(r.Context())
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		var commentData models.Comment
		err := json.NewDecoder(r.Body).Decode(&commentData)
		if err != nil {
			fmt.Println(err)
			http.Error(w, "Bad Request", http.StatusBadRequest)
			return
		}
		err = svc.Repo.AddComment(commentData.PostID, session.UserID, session.Username, commentData.Content)
		if err != nil {
			fmt.Println(err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		services.SenData(w, "message", "Comment created successfully", http.StatusOK)
	}
}

func GetCommentsHandler(svc *services.UserService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, ok := services.GetSession(r.Context())
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		postIDStr := r.URL.Query().Get("postId")
		postID, err := strconv.Atoi(postIDStr)
		if err != nil {
			fmt.Println("err of atoi", err)
			http.Error(w, "Bad Request", http.StatusBadRequest)
			return
		}
		comments, err := svc.Repo.GetComments(postID)
		if err != nil {
			fmt.Println("err of data base", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		services.SenData(w, "comments", comments, http.StatusOK)
	}
}
