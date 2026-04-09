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
		log.Fatal("error initializing database : ", err)
	}
	defer DB.Close()
	handler := routes.RegisterRoutes(DB)

	fmt.Println("Server is running on port http://localhost:8080")
	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatal("error starting server : %v", err)
	}
}
