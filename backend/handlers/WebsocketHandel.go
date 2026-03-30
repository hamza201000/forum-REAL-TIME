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

func WsHandel(svc *services.UserService) http.HandlerFunc {
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
			m.Sender_id = session.UserID
			m.Username_sender = session.Username
			err = svc.Repo.InsertMessage(m)
			if err != nil {
				fmt.Println(err)
				return
			}
			targetConn, ok := clients[m.Receiver_id]
			if ok {
				fmt.Println("done")
				dataMessage, err := json.Marshal(m)
				if err != nil {
					fmt.Println(err)
					return
				}
				targetConn.WriteMessage(websocket.TextMessage, dataMessage)
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
