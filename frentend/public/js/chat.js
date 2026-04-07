import { socket } from "./helpers.js";
import { sendData } from "./api.js";

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

    // prevent opening same chat twice
    if (document.getElementById("chat-" + user.id)) return;

    const chatBox = document.createElement("div");
    chatBox.className = "chat-box";
    chatBox.id = "chat-" + user.id;
    chatBox.innerHTML = `
    <div class="chat-header">
      <div class="chat-user">
        <span>${user.username}</span>
        <span class="chat-status ${user.online ? "online" : "offline"}"></span>
      </div>
      <button onclick="closeChat('${user.id}')">✕</button>
    </div>

    <div class="chat-body" id="messages-${user.id}">
      <!-- messages will come from backend -->
      
    </div>

    <div class="chat-input" id=${user.id} data-username="${user.username}">
      <input type="text" placeholder="Type a message...">
    </div>
  `;
    container.appendChild(chatBox);
    getMessage(user.id)
    // socket.send(JSON.stringify({
    //   Receiver_id: Number(user.id)
    // }))
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
}


export function closeChat(userId) {
    const chat = document.getElementById("chat-" + userId);
    if (chat) chat.remove();
}

export function sendMessage(input, user) {
    const message = input.value.trim();
    if (!message) return;

    // TEMP: show message in UI
    // const msgBox = document.getElementById("messages-" + user.id);
    // const msg = document.createElement("div");

    // msg.textContent = user.username + ":" + message;
    // msgBox.appendChild(msg);

    // TODO: send via WebSocket (Go backend)
    // socket.send(JSON.stringify({ to: userId, message }));



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
        if (msgBox) {
            addMessageTest(dataMessage, msgBox)
        }
        // if (!msgBox) {
        //     updatenewMsg(dataMessage)
        //     return
        // }
    } else if (dataMessage.type === "MsgtoReceiver") {
        msgBox = document.getElementById("messages-" + dataMessage.Sender_id)
        // if (!msgBox) {
        //     updatenewMsg(dataMessage)
        //     // const ntfUser = document.getElementById("" + dataMessage.Sender_id)
        //     // ntfUser.style.backgroundColor = "red"
        //     // console.log(ntfUser);
        //     // const newMsg = ntfUser.querySelector(".new-message")
        //     // console.log(newMsg);
        //     // newMsg.innerHTML = `<span>${" (new message) " + dataMessage.Message}</span>`
        //     return
        // }
        if (msgBox) {
            addMessageTest(dataMessage, msgBox)
        }
    }
    // msg.textContent = dataMessage.Username_sender + ":" + dataMessage.Message
    // msgBox.appendChild(msg)
    if (msgBox) {
        const isAtBottom = msgBox.scrollHeight - msgBox.scrollTop <= msgBox.clientHeight + 50
        if ((dataMessage.type === "MsgtoSender") || (dataMessage.type == "MsgtoReceiver" && isAtBottom)) {
            console.log(msgBox);
            msgBox.scrollTop = msgBox.scrollHeight;
        }
    }
}

export async function getMessage(User_id) {
    const dataMessage = await sendData(
        Number(User_id),
        "/api/getMessages",
        "POST"
    );
    const container = document.getElementById(`messages-${User_id}`);
    if (dataMessage && !Array.isArray(dataMessage.allmessages)) {
        console.error("Not array:", dataMessage);
        return;
    }
    container.innerHTML = "";
    dataMessage.allmessages.forEach((data) => {
        addMessageTest(data, container);
    });
    // const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
    // if (isAtBottom) {
    //     container.scrollTop = container.scrollHeight;
    // }
    container.scrollTop = container.scrollHeight;
}

export function addMessageTest(data, container, myMessage) {
    // console.log(container.id.replace(/\D/g, ""));
    myMessage = data.Receiver_id === Number(container.id.replace(/\D/g, ""))
    // myMessage = data.senderId === Number(getUserChat())
    const div = document.createElement("div");
    div.className = `message ${myMessage ? 'me' : 'them'}`;
    // div.textContent = data.Username_sender + ":" + data.Message;
      div.innerHTML = `<div class="bubble">${data.Message}</div>`;

    
    container.appendChild(div);
}

