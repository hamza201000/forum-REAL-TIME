package main

import (
	"log"
	"net/http"

	"backend/db"
	"backend/routes"
)

func main() {
	DB, err := db.InitDB()
	if err != nil {
		return
	}
	defer DB.Close()
	handler := routes.RegisterRoutes(DB) // handler http.Handler
	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatal("error starting server : %v", err)
	}
}
