package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"backend/middleware"
	"backend/models"
	"backend/services"
)

func HomeHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		content, err := os.ReadFile("../frentend/public/index.html")
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
		session, err := svc.Repo.CreateSession(userID, username)
		if err != nil {
			services.SenData(w, "error", "Failed to create session", http.StatusInternalServerError)
			return
		}
		middleware.SetSessionCookie(session, w)
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
			services.SenData(w, "message", "Posts endpoint is working", http.StatusOK)
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

		err = svc.Repo.CreatePost(data)
		if err != nil {
			services.SenData(w, "message", "Intarnal servre", http.StatusInternalServerError)
			return
		}

		services.SenData(w, "message", "Post created successfully", http.StatusOK)
	})
}

func GetPost(svc *services.UserService) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		posts, err := svc.Repo.GetAllPost()
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
		var User_id int

		err := json.NewDecoder(r.Body).Decode(&User_id)
		if err != nil {
			fmt.Println(err)
			services.SenData(w, "error", "Invalid request body", http.StatusBadRequest)
			return
		}
		ctx := r.Context()
		session, ok := services.GetSession(ctx)
		if !ok {
			fmt.Println("session", ok)
			return
		}
		fmt.Println(User_id)
		AllMessages, err := svc.Repo.GetMessages(session.UserID, User_id)
		if err != nil {
			fmt.Println(err)
			return
		}
		services.SenData(w, "allmessages", AllMessages, http.StatusOK)
	})
}
