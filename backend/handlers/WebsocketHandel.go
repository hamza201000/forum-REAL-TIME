package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"backend/models"
	"backend/services"

	"github.com/gorilla/websocket"
)

var (
	clients = make(map[int]*websocket.Conn) // userID -> connection
	Upgrade = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
)

func WsHandel() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, _ := Upgrade.Upgrade(w, r, nil)
		ctx := r.Context()
		session, ok := services.GetSession(ctx)
		if !ok {
			return
		}
		clients[session.UserID] = conn
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				return
			}
			var m models.DataMessage
			json.Unmarshal(message, &m)
			targetConn, ok := clients[m.To]
			fmt.Println("ok:", ok)
			if ok {
				targetConn.WriteMessage(websocket.TextMessage, message)
			}
			// if string(message) == "ping" {

			// 	if !ok {
			// 		fmt.Println(ok)
			// 		return
			// 	}
			// 	session.MessagePong = "pong"
			// 	jsonBytes, err := json.Marshal(session)
			// 	if err != nil {
			// 		log.Println("jason marshal err:", err)
			// 		return
			// 	}
			// 	err = conn.WriteMessage(websocket.TextMessage, jsonBytes)
			// 	if err != nil {
			// 		log.Println(err)
			// 		return
			// 	}
			// 	fmt.Println("ok daz")
			// 	continue
			// }
		}
	}
}
