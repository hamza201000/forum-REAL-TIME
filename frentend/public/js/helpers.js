

export let socket = null
const messageQueue = []


export function connectSocket() {
  socket = new WebSocket("ws://localhost:8080/api/ws");

  socket.onopen = () => {
    // Flush any queued messages
    messageQueue.forEach(msg => socket.send(msg))
    messageQueue.length = 0
  }
}

export function safeSend(data) {
  const msg = JSON.stringify(data)
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(msg)
  } else {
    messageQueue.push(msg)  // queue it until connection opens
  }
}
/* ── Helpers ── */
export function escHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function formatTime(sqliteDate) {
  
  const date = new Date(sqliteDate.replace(" ", "T") );
  const diff = Date.now() - date.getTime();
  console.log(diff);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}