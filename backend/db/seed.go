package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

func InitDB() *sql.DB {
	db, err := sql.Open("sqlite3", "./social.db")
	if err != nil {
		log.Fatal(err)
	}
	sqlFile, err := os.ReadFile("db/schema.sql")
	if err != nil {
		log.Fatal(err)
	}
	_, err = db.Exec(string(sqlFile))
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Database & tables created successfully")
	return db
}
