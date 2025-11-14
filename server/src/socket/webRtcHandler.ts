import { Server, Socket } from 'socket.io';

export const registerWebRTCHandlers = (io: Server, socket: Socket) => {
  
  socket.on("webrtc-offer", (data) => {
    const {targetSocketId, offer} = data

    socket.to(targetSocketId).emit('webrtc-offer', {
      senderSocketId: socket.id,
      offer,
    })
  });

  socket.on("webrtc-answer", (data) => {
    const{targetSocketId, answer} = data;
    socket.to(targetSocketId.emit('webrtc-answer'), {
      senderSocketId: socket.id,
      answer,
    })
  });

  socket.on('webrtc-ice-candidate', (data) => {
    const {targetSocketId, candidate} = data;
    socket.to(targetSocketId).emit('webrtc-ice-candidate', {
      senderSocketId: socket.id,
      candidate,
    })
  })

};
