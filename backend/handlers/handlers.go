package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"backend/models"
)

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var data models.User
	err := json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		fmt.Println("Error")
		return
	}
	fmt.Println(data)
	fmt.Printf("Neckname: %s, Email: %s, Password: %s, ConfPassword: %s\n", data.Neckname, data.Email, data.Password, data.ConfPassword)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "User registered successfully",
	})
}
