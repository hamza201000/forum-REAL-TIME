package services

import (
	"encoding/json"
	"net/http"
)

func SenData(w http.ResponseWriter, key string, message any, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	
	json.NewEncoder(w).Encode(map[string]any{
		key: message,
	})
}
