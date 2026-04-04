
import { sendData } from "./api.js";
import { getUserChat } from "./chat.js";
import { safeSend } from "./helpers.js";

export async function renderContacts() {
  try {
    // const ws = new WebSocket("ws://localhost:8080/api/ws")
    const res = await sendData({}, "/api/allUsers", "GET");
    const users = res && res.allusers ? res.allusers : [];
    // const onlineIds = await sendData({}, "/api/online-users", "GET");
    // updateOnlineCount(users,{user_ids: onlineIds})
    safeSend({ type: "online_users" })
    return users
    // socket.send(JSON.stringify({ type: "online_users" }))
    // document.getElementById("online-count").textContent =
    //   onlineUsers.length + " online";
  } catch (err) {
    console.error("Failed to load contacts:", err);
  }
}
//CONTACTS — fetch online users from API
export function updateOnlineCount(users, data) {
  const onlineIds = data.user_ids || []
    (onlineIds);

  users.forEach(u => {
    if (onlineIds && onlineIds.includes(u.User_id)) {
      u.online = true
    } else {
      u.online = false
    }
  })
  const onlineUsers = users.filter(u => u.online);
  document.getElementById("online-contacts").innerHTML = users.map(contactRow).join("")
  document.getElementById("online-count").textContent = onlineUsers.length + " online"
  const userChat = getUserChat()
  if (!userChat) {
    ("userChat", userChat);
    return
  }
  const online = document.querySelector(".chat-user")
  if (onlineIds && onlineIds.includes(Number(userChat))) {
    online.querySelector(".chat-status").className = "chat-status online"
  } else {
    online.querySelector(".chat-status").className = "chat-status offline"
  }
}
/* Expected shape per user from /api/online-users:
    { username: "alice", online: true, lastSeen: null | "5m ago" } */
function contactRow(u) {
  (u);

  const initial = (u.Username || "?")[0].toUpperCase();
  return `
     
        <div class="contact-item" id=${u.User_id}>
          <div class="contact-avatar-wrap">
            <div class="contact-avatar">${initial}
             <span class="status-dot ${u.online ? "online" : "offline"}"></span>
             </div>
            
          </div>
          <span class="contact-name">${u.Username}</span>
          <div class="new-message"></div>
          ${!u.online && u.lastSeen
      ? `<span class="contact-time">${u.lastSeen}</span>`
      : ""}
        </div>`;
}

