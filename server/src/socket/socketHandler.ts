// src/socket/socketHandler.ts

import { Server as SocketServer } from 'socket.io';
import http from 'http';

export const initializeSocketIO = (server: http.Server) => {
  // Create a new Socket.IO server instance
  const io = new SocketServer(server, {
    cors: {
      origin: "*", // Allow all origins for development
      methods: ["GET", "POST"]
    }
  });

  // Listen for the main 'connection' event
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Listen for this specific user to disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
    });
    
    // All other socket event listeners for this user will go here
    // e.g., socket.on('join-room', ...)
  });

  // Return the io instance, in case we need to access it from index.ts
  return io;
};