package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"backend/models"
	"backend/services"

	"golang.org/x/sys/windows/svc"
)

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
		var data models.LoginRequest
		err := json.NewDecoder(r.Body).Decode(&data)
		if err != nil {
			services.SenData(w, "error", "Invalid request body", http.StatusBadRequest)
			return
		}
		
	}
}