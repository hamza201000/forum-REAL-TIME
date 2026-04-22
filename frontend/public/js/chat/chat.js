import { formatDate } from "../utils/helpers.js";
import { socket } from "./socket.js";

import { sendData } from "../core/api.js";


let isLoading = false;
let lastMsgID = 0;

export function getUserChat() {
    const chatBox = document.querySelector(".chat-box")
    if (!chatBox) {
        return
    }
    const userid = chatBox.id.replace(/\D/g, "")
    return userid
}

export function openChat(user) {
    const container = document.getElementById("chat-container");
    const chatBox = document.createElement("div");
    chatBox.className = "chat-box";
    chatBox.id = "chat-" + user.id;
    chatBox.innerHTML = `
    <div class="chat-header">
      <div class="chat-user">
        <span>${user.username}</span>
        <span class="chat-status ${user.online ? "online" : "offline"}"></span>
      </div>
      
    </div>
    <div class="chat-body" id="messages-${user.id}">
    </div>
    <div class="chat-input" id="${user.id}" data-username="${user.username}">
      <input type="text" placeholder="Type a message...">
    </div>
  `;
    container.appendChild(chatBox);
    isLoading = false;
    lastMsgID = 0;
    getMessage(user.id)

    const input = chatBox.querySelector(".chat-input")
    input.addEventListener("keydown", (e) => {
        if (e.key != "Enter") return;
        const user = {
            id: input.id,
            username: document.getElementById('nav-username').textContent
        };
        sendMessage(e.target, user)
    })
    const chatHeader = chatBox.querySelector(".chat-header");
    chatHeader.addEventListener("mousedown", () => {
        closeChat(user.id);
    })

    const chatContainer = document.getElementById(`messages-${user.id}`);
    chatContainer.innerHTML = "";

    chatContainer.addEventListener(
        "scroll",
        debounce(async () => {
            ("ok", lastMsgID);
            if (chatContainer.scrollTop === 0) {
                await getMessage(user.id);
            }
        }, 200)
    );
}


export async function getMessage(User_id) {
    if (isLoading) return;
    isLoading = true;
    const dataMessage = await sendData(
        {
            lastMsgID: lastMsgID,
            userID: Number(User_id)
        },
        "/api/getMessages",
        "POST"
    );
    if (dataMessage && !Array.isArray(dataMessage.allmessages)) {
        // console.error("Not array:", dataMessage);
        return;
    }
    const container = document.getElementById(`messages-${User_id}`);
    const oldHeight = container.scrollHeight;
    dataMessage.allmessages.forEach((data) => {
        const div = buildMessage(data, Number(container.id.replace(/\D/g, "")))
        container.prepend(div); // prepend, don't append
    });
    if (lastMsgID == 0) {
        container.scrollTop = container.scrollHeight; // scroll to bottom on first load
    } else {
        container.scrollTop = container.scrollHeight - oldHeight; // restore position
    }

    lastMsgID = dataMessage.allmessages[dataMessage.allmessages.length - 1] ? dataMessage.allmessages[dataMessage.allmessages.length - 1].id : lastMsgID; // update lastMsgID to oldest loaded message
    isLoading = false;
}



export function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

export function closeChat(userId) {
    const chat = document.getElementById("chat-" + userId);
    if (chat) {
        chat.remove();
        isLoading = false;
        lastMsgID = 0;
    }
}

export function sendMessage(input, user) {
    const message = input.value.trim();
    if (!message) return;
    socket.send(JSON.stringify({
        Type: "MsgtoReceiver",
        Receiver_id: Number(user.id),
        Message: message
    }))
    input.value = "";
}

export function addMessage(dataMessage) {
    let msgBox = null
    let chatmsgBox = null
    if (dataMessage.type === "MsgtoSender") {
        msgBox = document.getElementById("messages-" + dataMessage.Receiver_id)
        chatmsgBox = document.getElementById("chat-" + dataMessage.Receiver_id)
        if (msgBox) {
            if (lastMsgID == 0) {
                lastMsgID = dataMessage.id
            }
            msgBox.appendChild(buildMessage(dataMessage, Number(msgBox.id.replace(/\D/g, ""))))
        }
    } else if (dataMessage.type === "MsgtoReceiver") {
        msgBox = document.getElementById("messages-" + dataMessage.Sender_id)
        chatmsgBox = document.getElementById("chat-" + dataMessage.Sender_id)
        if (msgBox) {
            msgBox.appendChild(buildMessage(dataMessage, Number(msgBox.id.replace(/\D/g, ""))))
        }
    }
    if (msgBox) {
        const isAtBottom = msgBox.scrollHeight - msgBox.scrollTop <= chatmsgBox.clientHeight
        if ((dataMessage.type === "MsgtoSender") || (dataMessage.type == "MsgtoReceiver" && isAtBottom)) {
            msgBox.scrollTop = msgBox.scrollHeight;
        }
    }
}

export function buildMessage(data, userBarId) {
    const myMessage = userBarId == data.Receiver_id
    const div = document.createElement("div");
    div.className = `message ${myMessage ? 'me' : 'them'}`;
    div.innerHTML = `<div class="bubble">${ignorehtml(data.Message)}
       <span class="spacer"></span>
    <span class="time">${formatDate(data.created_at)}</span>
    </div>`;
    return div;
}

function ignorehtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}
