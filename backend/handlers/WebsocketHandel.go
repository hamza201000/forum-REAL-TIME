package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"backend/models"
	"backend/services"

	"github.com/gorilla/websocket"
)

var (
	clients = make(map[int][]*websocket.Conn)
	mu      sync.RWMutex
	Upgrade = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
)

func WsHandle(svc *services.UserService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := Upgrade.Upgrade(w, r, nil)
		if err != nil {
			fmt.Println("Upgrade error:", err)
			return
		}
		ctx := r.Context()
		if err != nil {
			http.Error(w, "Unauthorized - no cookie", http.StatusUnauthorized)
			return
		}
		session, ok := services.GetSession(ctx)
		if !ok {
			conn.Close()
			return
		}
		// // Configure connection limits and deadlines
		// conn.SetReadLimit(4096)
		// conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		// conn.SetPongHandler(func(string) error {
		// 	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		// 	return nil
		// })

		// Register connection
		mu.Lock()
		clients[session.UserID] = append(clients[session.UserID], conn)
		mu.Unlock()
		broadcastOnlineUsers()

		// Ping goroutine to keep connection alive
		// go func() {
		// 	ticker := time.NewTicker(30 * time.Second)
		// 	defer ticker.Stop()
		// 	for range ticker.C {
		// 		mu.Lock()
		// 		err := conn.WriteMessage(websocket.PingMessage, nil)
		// 		mu.Unlock()
		// 		if err != nil {
		// 			return
		// 		}
		// 	}
		// }()
		defer func() {
			mu.Lock()
			fmt.Println("defer hhhhh")
			for i, c := range clients[session.UserID] {
				if c == conn {
					clients[session.UserID] = append(clients[session.UserID][:i], clients[session.UserID][i+1:]...)
					break
				}
			}
			mu.Unlock()
			if len(clients[session.UserID]) == 0 {
				delete(clients, session.UserID)
				broadcastOnlineUsers()
			}
			conn.Close()
		}()

		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				fmt.Println("that err", err)
				return
			}
			var m models.DataMessage

			json.Unmarshal(message, &m)

			if m.Type == "online_users" {
				broadcastOnlineUsers()
				continue
			}

			if m.Type == "ping" {
				continue
			}

			m.Sender_id = session.UserID
			m.Username_sender = session.Username

			err = svc.Repo.InsertMessage(m)
			if err != nil {
				fmt.Println("Error inserting message:", err)
				return
			}

			dataMessageToReceiver, err := json.Marshal(m)
			if err != nil {
				fmt.Println(err)
				return
			}
			m.Type = "MsgtoSender"
			dataMessageToSender, err := json.Marshal(m)
			if err != nil {
				fmt.Println(err)
				return
			}
			// Send to receiver
			mu.RLock()
			receiverConns, ok := clients[m.Receiver_id]
			senderConns, ok2 := clients[session.UserID]
			if ok {
				fmt.Println(ok, receiverConns, dataMessageToReceiver)
				for _, target := range receiverConns {
					target.WriteMessage(websocket.TextMessage, dataMessageToReceiver)
				}
			}
			if ok2 {
				for _, target := range senderConns {
					target.WriteMessage(websocket.TextMessage, dataMessageToSender)
				}
			}
			mu.RUnlock()
		}
	}
}

func StatusHandler(svc *services.UserService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		session, ok := services.GetSession(ctx)
		if !ok {
			return
		}

		mu.RLock()
		var userIds []int
		for userId := range clients {
			if userId != session.UserID {
				userIds = append(userIds, userId)
			}
		}
		mu.RUnlock()

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		data, err := json.Marshal(userIds)
		if err != nil {
			fmt.Println(err)
			return
		}
		w.Write(data)
	}
}

func broadcastOnlineUsers() {
	if len(clients) == 0 {
		return
	}
	mu.RLock()
	var userIds []int
	for userId := range clients {
		userIds = append(userIds, userId)
	}
	connsSnapshot := make(map[int][]*websocket.Conn, len(clients))
	for k, v := range clients {
		connsSnapshot[k] = v
	}
	mu.RUnlock()

	msg := map[string]interface{}{
		"type":     "online_users",
		"user_ids": userIds,
	}
	data, _ := json.Marshal(msg)
	for _, conns := range connsSnapshot {
		for _, conn := range conns {
			mu.Lock()
			conn.WriteMessage(websocket.TextMessage, data)
			mu.Unlock()

		}
	}
}
