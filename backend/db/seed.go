package db

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

<<<<<<< HEAD
func InitDB() *sql.DB {

	db, err := sql.Open("sqlite3", "./social.db?_foreign_keys=on")
=======
func InitDB() (*sql.DB, error) {
	db, err := sql.Open("sqlite3", "./social.db")
>>>>>>> forum-main
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	sqlFile, err := os.ReadFile("db/schema.sql")
	if err != nil {
		return nil, err
	}
	_, err = db.Exec(string(sqlFile))
	if err != nil {
		return nil, err
	}
	fmt.Println("Database & tables created successfully")
	return db, nil
}
