package services

import (
	"encoding/json"
	"net/http"
)

func SenData(w http.ResponseWriter, key, message string, statusCode int) {
	w.WriteHeader(statusCode)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		key: message,
	})
}
