import { io, Socket } from "socket.io-client";
import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL;

const RoomPage = () => {
  const { roomId } = useParams();

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("Socket connected, emitting join-room...");

      newSocket.emit("join-room", { roomId });
    });
    return () => {
      newSocket.disconnect();
    };
  }, [roomId, BACKEND_URL]);
  return (
    <div>
      <h1>Room: {roomId}</h1>
    </div>
  );
};

export default RoomPage;
