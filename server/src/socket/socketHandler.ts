import { Server as SocketServer } from "socket.io";
import http from "http";
import { registerRoomHandlers } from "./roomHandler.js";
import { registerWebRTCHandlers } from "./webRtcHandler.js"

export const initializeSocketIO = (server: http.Server) => {
  const io = new SocketServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    registerRoomHandlers(io, socket);

    registerWebRTCHandlers(io, socket)
  });

  return io;
};
