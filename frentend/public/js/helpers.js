

export let socket = null
const messageQueue = []


export function connectSocket() {
  socket = new WebSocket("ws://localhost:8080/api/ws");
  socket.onopen = () => {
    messageQueue.forEach(msg => socket.send(msg))
    messageQueue.length = 0
  }
}

export function safeSend(data) {
  const msg = JSON.stringify(data)
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(msg)
  } else {
    messageQueue.push(msg)
  }
}
export function escHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}