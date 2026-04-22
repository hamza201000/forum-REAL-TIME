export let socket = null
const messageQueue = []


export function connectSocket() {
  socket = new WebSocket("ws://localhost:8080/api/ws");
  socket.onopen = () => {
    messageQueue.forEach(msg => socket.send(msg))
    messageQueue.length = 0
  }
  socket.onclose = () => {
    console.log("Socket closed")
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