import { Server } from "socket.io";

let io = null;

export function initSocket(httpServer, corsOrigin) {
  io = new Server(httpServer, { cors: { origin: corsOrigin } });
  io.on("connection", (socket) => {
    console.log(`⚡ Dashboard client connected: ${socket.id}`);
    socket.on("disconnect", () => console.log(`⚡ Dashboard client disconnected: ${socket.id}`));
  });
  return io;
}

export function getIO() {
  return io;
}
