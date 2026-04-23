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

func addClient(userID int, conn *websocket.Conn) {
	mu.Lock()
	defer mu.Unlock()
	clients[userID] = append(clients[userID], conn)
}

func removeClient(userID int, conn *websocket.Conn) bool {
	mu.Lock()
	defer mu.Unlock()
	userClients := clients[userID]
	for i, c := range userClients {
		if c == conn {
			userClients = append(userClients[:i], userClients[i+1:]...)
			if len(userClients) == 0 {
				delete(clients, userID)
				return true
			}
			clients[userID] = userClients
			return false
		}
	}
	return len(userClients) == 0
}

func disconnectUser(userID int) {
	mu.Lock()
	userClients := append([]*websocket.Conn(nil), clients[userID]...)
	delete(clients, userID)
	mu.Unlock()

	for _, conn := range userClients {
		conn.Close()
	}
}

func WsHandle(svc *services.UserService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("**websocket handler", r.Method)	
		conn, err := Upgrade.Upgrade(w, r, nil)
		if err != nil {
			services.SenData(w, "error", "WebSocket upgrade failed", http.StatusBadRequest)

			return
		}
		ctx := r.Context()
		session, ok := services.GetSession(ctx)
		if !ok {
			services.SenData(w, "error", "Unauthorized ", http.StatusUnauthorized)
			conn.Close()
			return
		}
		addClient(session.UserID, conn)

		defer func() {
			removedLast := removeClient(session.UserID, conn)
			conn.Close()
			if removedLast {
				broadcastOnlineUsers()
			}
<<<<<<< HEAD
			conn.Close()
		}() 
=======
		}()
>>>>>>> forum-main
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				fmt.Println(err)
				return
			}
			var m models.DataMessage
			json.Unmarshal(message, &m)
			if m.Type == "online_users" {
				broadcastOnlineUsers()
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
			services.SenData(w, "error", "Unauthorized ", http.StatusUnauthorized)
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
	mu.RLock()
	if len(clients) == 0 {
		mu.RUnlock()
		return
	}
	var userIds []int
	for userId := range clients {
		userIds = append(userIds, userId)
	}
	connsSnapshot := make(map[int][]*websocket.Conn, len(clients))
	for k, v := range clients {
		connsSnapshot[k] = append([]*websocket.Conn(nil), v...)
	}
	mu.RUnlock()
	msg := map[string]interface{}{
		"type":     "online_users",
		"user_ids": userIds,
	}
	data, _ := json.Marshal(msg)
	for _, conns := range connsSnapshot {
		for _, conn := range conns {
			conn.WriteMessage(websocket.TextMessage, data)
		}
	}
}

func broadcastNewUsers() {
	mu.RLock()
	if len(clients) == 0 {
		mu.RUnlock()
		return
	}
	connsSnapshot := make(map[int][]*websocket.Conn, len(clients))
	for k, v := range clients {
		connsSnapshot[k] = append([]*websocket.Conn(nil), v...)
	}
	mu.RUnlock()
	msg := map[string]interface{}{
		"type": "new_user",
	}
	data, _ := json.Marshal(msg)
	for _, conns := range connsSnapshot {
		for _, conn := range conns {
			conn.WriteMessage(websocket.TextMessage, data)
		}
	}
}

func checkOnlineUser(userID int) bool {
	mu.RLock()
	_, online := clients[userID]
	mu.RUnlock()
	return online
}
