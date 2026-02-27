package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"backend/models"
	"backend/services"
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
				ErrorData(w, "Email already exists", http.StatusConflict) // 409
				return
			}
			if strings.Contains(err.Error(), "username") {
				ErrorData(w, "Username already exists", http.StatusConflict)
				return
			}
			ErrorData(w, "Failed to register user", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "User registered successfully",
		})
	}
}

func ErrorData(w http.ResponseWriter, message string, statusCode int) {
	w.WriteHeader(statusCode)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"error": message,
	})
}
