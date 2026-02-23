package routes

import "net/http"

func RegisterRoutes() {
	fs := http.FileServer(http.Dir("../frentend/public"))
	http.Handle("/", fs)
}
