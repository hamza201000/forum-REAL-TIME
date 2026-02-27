package main

import (
	"net/http"

	"backend/db"
	"backend/handlers"
	"backend/repository"
	"backend/routes"
	"backend/services"
)

func main() {
	DB := db.InitDB()
	defer DB.Close()
	routes.RegisterRoutes()

	userRepo := repository.NewUserRepository(DB)
	userService := services.NewUserService(userRepo)
	http.HandleFunc("/register", handlers.RegisterHandler(userService))
	http.ListenAndServe(":8080", nil)
}
