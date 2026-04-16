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
	userRepo := repository.NewUserRepository(DB)
	userService := services.NewUserService(userRepo)
	// userRepo.DeleteFromDB()
	fs := http.FileServer(http.Dir("../frontend/public"))
	mux.Handle("/static/", http.StripPrefix("/static", fs)) 
	// Register API routes
	mux.Handle("/api/register", handlers.RegisterHandler(userService)) // Handle /register POST requests
	mux.Handle("/api/login", handlers.LoginHandler(userService))       // Handle /login POST requests
	mux.Handle("/api/session", middleware.AuthMiddleware(handlers.SessionHandler(), userService))
	mux.Handle("/api/logout", handlers.LogoutHandler(userService))
	mux.Handle("/api/posts", middleware.AuthMiddleware(handlers.PostsHandler(userService), userService))
	mux.Handle("/api/getPosts", middleware.AuthMiddleware(handlers.GetPost(userService), userService))
	mux.Handle("/api/allUsers", middleware.AuthMiddleware(handlers.GetAllUsers(userService), userService))
	mux.Handle("/api/getMessages", middleware.AuthMiddleware(handlers.GetMessages(userService), userService))
	mux.Handle("/api/online-users", middleware.AuthMiddleware(handlers.StatusHandler(userService), userService))
	mux.Handle("/api/like", middleware.AuthMiddleware(handlers.LikeHandler(userService), userService))
	mux.Handle("/api/comments",middleware.AuthMiddleware(handlers.CommentHandler(userService), userService))
	mux.Handle("/api/getComments",middleware.AuthMiddleware(handlers.GetCommentsHandler(userService), userService))
	mux.Handle("/", (handlers.HomeHandler()))
	mux.Handle("/api/ws", middleware.AuthMiddleware(handlers.WsHandle(userService), userService))
	return mux
}
