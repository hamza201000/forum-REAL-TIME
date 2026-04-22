export let socket = null
const messageQueue = []
let retries=0

export function connectSocket() {
  socket = new WebSocket("ws://localhost:8080/api/ws");
  socket.onopen = () => {
    messageQueue.forEach(msg => socket.send(msg))
    messageQueue.length = 0
    retries=0
  }
  
 socket.onclose = () => {
    const timeout = Math.min(1000 * 2 ** retries, 30000);
    retries++;
    setTimeout(connectSocket, timeout);
  };
}

export function safeSend(data) {
  const msg = JSON.stringify(data)
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(msg)
  } else {
    messageQueue.push(msg)
  }
}