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
		// _, message, err := conn.ReadMessage()
		// if err != nil {
		// 	return
		// }
		// var DataCnv models.DataMessage
		// json.Unmarshal(message, &DataCnv)
		// AllMessages, err := svc.Repo.GetMessages(session.UserID, DataCnv.Receiver_id)
		// if err != nil {
		// 	fmt.Println(err)
		// 	return
		// }
		// targetConn, ok := clients[session.UserID]
		// if ok {
		// 	dataMessage, err := json.Marshal(AllMessages)
		// 	if err != nil {
		// 		fmt.Println(err)
		// 		return
		// 	}
		// 	targetConn.WriteMessage(websocket.TextMessage, dataMessage)
		// }
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				return
			}
			// if strings.Contains(string(message),"ping"){

			// 	continue
			// }
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
				dataMessage, err := json.Marshal(m)
				if err != nil {
					fmt.Println(err)
					return
				}
				targetConn.WriteMessage(websocket.TextMessage, dataMessage)
			}
			// if string(message) == "ping" {
			// 	if !ok {
			// 		ok)
			// 		return
			// 	}
			// 	session.MessagePong = "pong"
			// 	jsonBytes, err := json.Marshal(session)
			// 	if err != nil {
			// 		log.Println("jason marshal err:", fmt.Println(err)
			// 		return
			// 	}
			// 	err = conn.WriteMessage(websocket.TextMessage, jsonBytes)
			// 	if err != nil {
			// 		log.Println(fmt.Println(err)
			// 		return
			// 	}
			// 	"ok daz")
			// 	continue
			// }
		}
	}
}
