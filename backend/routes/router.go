package routes

import (
	"backend/handlers"
	"backend/middleware"
	"backend/repository"
	"backend/services"
	"database/sql"
	"net/http"
	"os"
)

func SPAHandler() http.Handler {
	fs := http.FileServer(http.Dir("../frontend/public"))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := "../frontend/public" + r.URL.Path

		if _, err := os.Stat(path); os.IsNotExist(err) {
			http.ServeFile(w, r, "../frontend/public/index.html")
			return
		}

		fs.ServeHTTP(w, r)
	})
}
func RegisterRoutes(DB *sql.DB) http.Handler {
	mux := http.NewServeMux()
	userRepo := repository.NewUserRepository(DB)
	userService := services.NewUserService(userRepo)
	mux.Handle("/", middleware.AuthMiddleware(SPAHandler(), userService))
	mux.Handle("/register", handlers.RegisterHandler(userService))
	mux.Handle("/login", (handlers.LoginHandler(userService)))
	return mux
}
