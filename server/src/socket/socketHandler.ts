import { Server as SocketServer } from "socket.io";
import http from "http";

export const initializeSocketIO = (server: http.Server) => {
  const io = new SocketServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("join-room", (data) => {
      const { roomId } = data;
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on("send-message", (data) => {
      const { roomId, text } = data;
      const messagePayload = {
        text,
        authorId: socket.id,
      };
      io.to(roomId).emit("new-message", messagePayload);
    });
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};
