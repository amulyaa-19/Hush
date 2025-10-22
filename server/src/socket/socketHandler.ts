import { Server as SocketServer } from 'socket.io';
import http from 'http';

export const initializeSocketIO = (server: http.Server) => {
  const io = new SocketServer(server, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });

  });

  return io;
};