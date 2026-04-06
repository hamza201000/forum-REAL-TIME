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

  console.log(users);
  console.log(data);

  users.forEach(u => {
    if (onlineIds && onlineIds.includes(u.User_id)) {
      u.online = true
    } else {
      u.online = false
    }
  })
  users.sort((u1, u2) => {
    if (u1.LastMsg == null && u2.LastMsg == null) {
      return 0
    }
    if (u1.LastMsg == null) {
      return 1
    }
    if (u2.LastMsg == null) {
      return -1
    }
    return u1.LastMsg.id > u2.LastMsg.id ? -1 : 1; // Online users first
  });

  document.getElementById("online-contacts").innerHTML = users.map(contactRow).join("")
  const onlineUsers = users.filter(u => u.online);
  document.getElementById("online-count").textContent = onlineUsers.length + " online"
  const userChat = getUserChat()
  if (!userChat) {
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
  const initial = (u.Username || "?")[0].toUpperCase();
  const hasNewMsg = u.LastMsg && u.LastMsg.Seen == 0 && u.LastMsg.Sender_id == u.User_id

  console.log("hasNewMsg", hasNewMsg);
  return `
        <div class="contact-item" id=${u.User_id} style=${hasNewMsg ? "background-color:red" : ""}>
          <div class="contact-avatar-wrap">
            <div class="contact-avatar">${initial}
             <span class="status-dot ${u.online ? "online" : "offline"}"></span>
             </div>
             <span class="contact-name">${u.Username}</span>
          </div>
          
          <div class="new-message">
          <span >${u.LastMsg ? u.LastMsg.Message : ""}</span>
          </div>
          ${!u.online && u.lastSeen
      ? `<span class="contact-time">${u.lastSeen}</span>`
      : ""}
        </div>`;
}

