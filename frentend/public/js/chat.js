import { socket, safeSend } from "./helpers.js";
import { sendData } from "./api.js";


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

    console.log("isloading", isLoading, lastMsgID);
    isLoading = false;
    lastMsgID = 0;
    chatContainer.addEventListener(
        "scroll",
        debounce(async () => {
            console.log("ok", lastMsgID);
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
        console.error("Not array:", dataMessage);
        return;
    }
    const container = document.getElementById(`messages-${User_id}`);

    const oldHeight = container.scrollHeight;
    dataMessage.allmessages.forEach((data) => {
        const div = buildMessageEl(data, container);
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

async function loadMessages(user_id) {
    if (isLoading) return;
    isLoading = true
    await sendData(
        Number(user_id),
        "/api/getMessages",
        "POST"
    );
    isLoading = false;
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
    if (dataMessage.type === "MsgtoSender") {
        msgBox = document.getElementById("messages-" + dataMessage.Receiver_id)
        console.log(dataMessage.id);
        if (msgBox) {
            if (lastMsgID==0) {
                lastMsgID = dataMessage.id
            }
            addMessageTest(dataMessage, msgBox)
        }
    } else if (dataMessage.type === "MsgtoReceiver") {
        msgBox = document.getElementById("messages-" + dataMessage.Sender_id)
        if (msgBox) {
            addMessageTest(dataMessage, msgBox)
        }
    }
    if (msgBox) {
        const isAtBottom = msgBox.scrollHeight - msgBox.scrollTop <= msgBox.clientHeight + 50
        if ((dataMessage.type === "MsgtoSender") || (dataMessage.type == "MsgtoReceiver" && isAtBottom)) {
            console.log(msgBox);
            msgBox.scrollTop = msgBox.scrollHeight;
        }
    }
}



export function addMessageTest(data, container, myMessage) {
    myMessage = data.Receiver_id === Number(container.id.replace(/\D/g, ""))
    const div = document.createElement("div");
    div.className = `message ${myMessage ? 'me' : 'them'}`;
    div.innerHTML = `<div class="bubble">${data.Message}</div>`;
    container.appendChild(div);
}
export function buildMessageEl(data, container) {
    const myMessage = data.Receiver_id === Number(container.id.replace(/\D/g, ""));
    const div = document.createElement("div");
    div.className = `message ${myMessage ? 'me' : 'them'}`;
    div.innerHTML = `<div class="bubble">${data.Message}</div>`;
    return div;
}
