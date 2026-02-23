package models

type User struct {
	Neckname     string `json:"neckname"`
	Email        string `json:"email"`
	Password     string `json:"password"`
	ConfPassword string `json:"confPassword"`
}
