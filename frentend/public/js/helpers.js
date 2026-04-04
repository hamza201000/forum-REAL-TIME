

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

export function formatTime(ts) {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}