package main

import (
	"net/http"

	"backend/handlers"
	"backend/routes"
)



func main() {
	routes.RegisterRoutes()
	http.HandleFunc("/register", handlers.RegisterHandler)
	http.ListenAndServe(":8080", nil)
}
