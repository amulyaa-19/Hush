import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL;

interface IMessage {
  authorId: string;
  text: string;
}

const RoomPage = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");

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

    newSocket.on("new-message", (message: IMessage) => {
      // react add to previous list instead of overwriting it
      console.log("new message recieved:", message);
      setMessages((prevMessages) => [...prevMessages, message]);
    });
    return () => {
      newSocket.disconnect();
    };
  }, [roomId, BACKEND_URL]);
  return (
    <div className="flex flex-col h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Room: {roomId}</h1>
      <div className="grow border border-gray-300 rounded-lg p-4 overflow-y-auto mb-4 bg-gray-50">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <strong>
              {msg.authorId === socketRef.current?.id ? "You" : msg.authorId}
            </strong>
            : <span>{msg.text}</span>
          </div>
        ))}
      </div>
      <form className="flex">
        <input
          type="text"
          placeholder="Type your message"
          className="grow border border-gray-300 rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-500 cursor-pointer text-white p-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default RoomPage;
