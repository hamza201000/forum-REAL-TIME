package routes

import (
	"database/sql"
	"net/http"

	"backend/handlers"
	"backend/middleware"
	"backend/repository"
	"backend/services"
)

func RegisterRoutes(DB *sql.DB) http.Handler {
	mux := http.NewServeMux()

	// Initialize user repository and service
	userRepo := repository.NewUserRepository(DB)
	userService := services.NewUserService(userRepo)

	// Serve static files for requests that are not API endpoints (e.g., /login, /register)
	fs := http.FileServer(http.Dir("../frentend/public"))
	mux.Handle("/static/", http.StripPrefix("/static", fs)) // Serve static files under /static path

	// Register API routes
	mux.Handle("/api/register", handlers.RegisterHandler(userService)) // Handle /register POST requests
	mux.Handle("/api/login", handlers.LoginHandler(userService))       // Handle /login POST requests
	mux.Handle("/api/session",middleware.AuthMiddleware( handlers.SessionHandler(),userService))
	// Optionally serve the index.html (or other entry point) for the root path (/)
	mux.Handle("/", (handlers.HomeHandler()))
	return mux
}
