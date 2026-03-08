package main

import (
	"net/http"

	"backend/db"
	"backend/routes"
)

func main() {
	DB := db.InitDB()
	defer DB.Close()
	routes.RegisterRoutes(DB)
	http.ListenAndServe(":8080", nil)
}
