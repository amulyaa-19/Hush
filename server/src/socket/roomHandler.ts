import { Server, Socket } from "socket.io";

const getUsersInRoom = (io: Server, roomId: string) => {
  const users: { id: string; username: string }[] = [];
  const room = io.sockets.adapter.rooms.get(roomId);

  if (room) {
    room.forEach((socketId) => {
      const userSocket = io.sockets.sockets.get(socketId);
      if (userSocket && userSocket.data.username) {
        users.push({
          id: userSocket.id,
          username: userSocket.data.username,
        });
      }
    });
  }
  return users;
};

export const registerRoomHandlers = (io: Server, socket: Socket) => {

  socket.on("join-room", (data) => {
    const { roomId, username } = data;
    socket.data.username = username;
    socket.join(roomId);

    console.log(
      `Socket ${socket.id} (Username: ${username}) joined room ${roomId}`
    );
    const users = getUsersInRoom(io, roomId);
    io.to(roomId).emit("update-user-list", { users });
  });

  socket.on("send-message", (data) => {
    const { roomId, text } = data;
    const authorName = socket.data.username || socket.id;
    const messagePayload = { text, authorName };
    io.to(roomId).emit("new-message", messagePayload);
  });

  socket.on("disconnecting", () => {
    console.log(`User disconnecting: ${socket.id}`);

    socket.rooms.forEach((roomId) => {
      if (roomId !== socket.id) {
 
        const users = getUsersInRoom(io, roomId);

        const departingUser = users.find((user) => user.id === socket.id);
  
        const remainingUsers = users.filter((user) => user.id !== socket.id);

        if (remainingUsers.length > 0) {
          socket.to(roomId).emit("update-user-list", { users: remainingUsers });
        }
      }
    });
  });
};
