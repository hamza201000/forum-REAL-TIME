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
		fmt.Println(data)
		fmt.Println(err)
		if err != nil {
			fmt.Println("Error")
			return
		}
		err = svc.RegisterUser(data)
		if err != nil {
			fmt.Println("Error creating user:", err)

			if strings.Contains(err.Error(), "email") {
				fmt.Println("okook")
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

		userID, err := svc.LoginUser(data)
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
		session, err := svc.Repo.CreateSession(userID)
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
		json.NewEncoder(w).Encode(map[string]interface{}{
			"userID":    session.UserID,
			"expiresAt": session.ExpiresAt,
		})
	})
}
