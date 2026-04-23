package db

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

func InitDB() (*sql.DB, error) {
	db, err := sql.Open("sqlite3", "./social.db")
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
