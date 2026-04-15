package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

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
		mu.Lock()
		clients[session.UserID] = append(clients[session.UserID], conn)
		mu.Unlock()

		defer func() {
			mu.Lock()
			for i, c := range clients[session.UserID] {
				if c == conn {
					clients[session.UserID] = append(clients[session.UserID][:i], clients[session.UserID][i+1:]...)
					break
				}
			}
			mu.Unlock()
			if len(clients[session.UserID]) == 0 {
				delete(clients, session.UserID)
				broadcastOnlineUsers(session.UserID)
			}
			conn.Close()
		}()
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				fmt.Println(err)
				return
			}
			var m models.DataMessage
			json.Unmarshal(message, &m)
			if m.Type == "online_users" {
				broadcastOnlineUsers(session.UserID)
				continue
			} else if m.Type == "MsgSeen" {
				err = svc.Repo.InsertSeenMessage(session.UserID, m.Sender_id)
				if err != nil {
					fmt.Println("Error updating seen status:", err)
				}
				continue
			} else if m.Type == "MsgtoReceiver" || m.Type == "MsgtoSender" {
				m.Sender_id = session.UserID
				m.Username_sender = session.Username
				m.CreatedAt = time.Now().UTC().Format(time.RFC3339)
				MessageId, err := svc.Repo.InsertMessage(m)
				if err != nil {
					fmt.Println("Error inserting message:", err)
					return
				}
				m.Id = MessageId
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
			mu.RLock()
			receiverConns, ok := clients[m.Receiver_id]
			senderConns, ok2 := clients[session.UserID]
			if ok {
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
		if r.Method == http.MethodPost {
			fmt.Println("status handler", r.Method)
			return
		}
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

func broadcastOnlineUsers(userSession int) {
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
