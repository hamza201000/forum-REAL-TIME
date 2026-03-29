package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"backend/services"

	"github.com/gorilla/websocket"
)


var clients = make(map[int]*websocket.Conn) // userID -> connection
var Upgrade = websocket.Upgrader{}

func WsHandel() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, _ := Upgrade.Upgrade(w, r, nil)
		ctx := r.Context()
		session, ok := services.GetSession(ctx)
		clients[session.UserID]=conn
		for {
			_, message, err := conn.ReadMessage()
			conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				return
			}
			if string(message) == "ping" {
				
				if !ok {
					fmt.Println(ok)
					return
				}
				session.MessagePong="pong"
				jsonBytes, err := json.Marshal(session)
				if err != nil {
					log.Println("jason marshal err:", err)
					return
				}
				err =conn.WriteMessage(websocket.TextMessage, jsonBytes)
				if err!=nil{
					log.Println(err)
					return
				}
				fmt.Println("ok daz")
				continue
			}
		}
	}
}
