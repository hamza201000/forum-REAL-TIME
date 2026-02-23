package main

import (
	"net/http"

	"backend/db"
	"backend/handlers"
	"backend/routes"
)

func main() {
	DB := db.InitDB()
	defer DB.Close()
	routes.RegisterRoutes()
	http.HandleFunc("/register", handlers.RegisterHandler)
	http.ListenAndServe(":8080", nil)
}
