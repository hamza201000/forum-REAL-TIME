package main

import (
	"fmt"
	"log"
	"net/http"

	"backend/db"
	"backend/routes"
)

func main() {
	DB, err := db.InitDB()
	if err != nil {
		log.Fatalf("error initializing database: %v", err)
	}

	defer DB.Close()

	handler := routes.RegisterRoutes(DB) // handler http.Handler

	fmt.Println("Server is running on http://localhost:8080")
	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatalf("error starting server: %v", err)
	}
}
