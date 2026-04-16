import { sendData } from "./api.js";
import { getUserChat } from "./chat.js";
import { safeSend } from "./socket.js";

export async function renderContacts() {
  try {
    const res = await sendData({}, "/api/allUsers", "GET");
    const users = res && res.allusers ? res.allusers : [];
    safeSend({ type: "online_users" })
    return users
  } catch (err) {
    console.error("Failed to load contacts:", err);
  }
}
export function renderCount(users) {
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
  const allcontacts = document.getElementById("online-contacts")
  const divs = [...allcontacts.querySelectorAll('.contact-item')];
  if (allcontacts) {
    allcontacts.innerHTML = users.map(contactRow).join("")
  }
}

function contactRow(u) {
  const initial = (u.Username || "?")[0].toUpperCase();
  const chatBox = document.querySelector(".chat-box")
  const hasNewMsg = !chatBox && u.LastMsg && u.LastMsg.Seen == 0 && u.LastMsg.Sender_id == u.User_id
  let itnkmymsg = null
  if (u.LastMsg) {
    if (u.LastMsg.Message.length>17){
      u.LastMsg.Message=u.LastMsg.Message.slice(0,16)+"........"
      console.log("u.LastMsg.Message".length);
    }
    itnkmymsg = u.LastMsg.Sender_id != u.User_id ? "you: " + u.LastMsg.Message : u.LastMsg.Username_sender + ": " + u.LastMsg.Message;
  }
  return `
        <div class="contact-item" id=${u.User_id} style=${hasNewMsg ? "background-color:red" : ""}>
          <div class="contact-avatar-wrap">
            <div class="contact-avatar">${initial}
             <span class="status-dot ${u.online ? "online" : "offline"}"></span>
             </div>
             <span class="contact-name">${u.Username}</span>
          </div>
          
          <div class="new-message">
          <span >${itnkmymsg ? itnkmymsg : ""}</span>
          </div>
          ${!u.online && u.lastSeen
      ? `<span class="contact-time">${u.lastSeen}</span>`
      : ""}
        </div>`;
}
export function updateOnlineUsers(userContacts, allUsersIds) {
  if (allUsersIds && allUsersIds.length !== 0) {
    document.getElementById("online-count").textContent = allUsersIds.length - 1 + " online"
  } else {
    document.getElementById("online-count").textContent = "0 online"
  }
  userContacts.forEach(u => {
    const userId = Number(u.id)
    if (allUsersIds && allUsersIds.includes(userId)) {
      u.querySelector(".status-dot").className = "status-dot online"
    } else {
      u.querySelector(".status-dot").className = "status-dot offline"
    }
  })
  const userChat = getUserChat()
  if (!userChat) {
    return
  }
  const online = document.querySelector(".chat-user")
  if (allUsersIds && allUsersIds.includes(Number(userChat))) {
    online.querySelector(".chat-status").className = "chat-status online"
  } else {
    online.querySelector(".chat-status").className = "chat-status offline"
  }
}


export function updatenewMsg(dataMessage) {
  let contactUser = null
  if (dataMessage.Message.length>17){
      dataMessage.Message=dataMessage.Message.slice(0,16)+"........"
    }
  if (dataMessage.type == "MsgtoReceiver") {
    contactUser = document.getElementById("" + dataMessage.Sender_id)
    const chatBox = document.getElementById("chat-" + dataMessage.Sender_id)
    const newMsg = contactUser.querySelector(".new-message")
    newMsg.innerHTML = `<span>${dataMessage.Username_sender + ": " + dataMessage.Message}</span>`
    if (!chatBox) {
      contactUser.style.backgroundColor = "red"
    }
  } else if (dataMessage.type == "MsgtoSender") {
    contactUser = document.getElementById("" + dataMessage.Receiver_id)
    const newMsg = contactUser.querySelector(".new-message")
    newMsg.innerHTML = `<span>${"you:" + dataMessage.Message}</span>`
    contactUser.style.backgroundColor = ""
  }
}


export function updateOnlineCount(users) {
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
    return u1.LastMsg.id > u2.LastMsg.id ? -1 : 1; 
  });
  const allcontacts = document.getElementById("online-contacts")
  const divs = [...document.querySelectorAll('.contact-item')];
  divs.sort((d1, d2) => {
    const u1 = users.find(u => u.User_id == d1.id)
    const u2 = users.find(u => u.User_id == d2.id)
    if (u1.LastMsg == null && u2.LastMsg == null) {
      return 0
    }
    if (u1.LastMsg == null) {
      return 1
    }
    if (u2.LastMsg == null) {
      return -1
    }
    return u1.LastMsg.id > u2.LastMsg.id ? -1 : 1;
  })
  divs.forEach(d => allcontacts.appendChild(d))
}



