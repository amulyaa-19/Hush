import { io, Socket } from "socket.io-client";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useWebRTC, type IUser } from "../hooks/useWebRTC";

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL;

interface IMessage {
  authorName: string;
  text: string;
}

const RoomPage = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const [users, setUsers] = useState<IUser[]>([]);
  const { roomId } = useParams();
  const socketRef = useRef<Socket | null>(null);
  const { localStream, remoteStreams, startLocalStream } = useWebRTC({
    socket: socketRef.current,
    users: users,
    mySocketId: socketRef.current?.id || null,
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMessage.trim() && socketRef.current) {
      socketRef.current.emit("send-message", {
        roomId,
        text: currentMessage,
      });
      setCurrentMessage("");
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === "") {
      alert("Please enter a username");
      return;
    }

    const newSocket = io(BACKEND_URL, {
      transports: ["websocket"],
    });
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      console.log("Socket connected, emitting join-room...");
      newSocket.emit("join-room", { roomId, username });
      setHasJoined(true);
    });

    newSocket.on("new-message", (message: IMessage) => {
      console.log("new message recieved:", message);
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    newSocket.on("update-user-list", (data: { users: IUser[] }) => {
      console.log("User list updated:", data.users);
      setUsers(data.users);
    });
  };

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  if (!hasJoined) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <form
          className="bg-white p-8 rounded-lg shadow-md"
          onSubmit={handleJoinRoom}
        >
          <h1 className="text-2xl font-bold mb-4">Join Room</h1>
          <div className="mb-4">
            <label className="block mb-2 font-bold">Room Code:</label>
            <span className="font-mono text-lg text-blue-600">{roomId}</span>
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-bold" htmlFor="username">
              Enter your username:
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name..."
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 cursor-pointer"
          >
            Join
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen p-4">
      <div className="flex justify-between items-center mb-4 p-2 bg-gray-100 rounded-lg">
        <div>
          <span className="font-bold">Share this Room Code: </span>
          <span className="font-mono text-blue-600">{roomId}</span>
        </div>
        <div className="flex items-center">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="ml-2 font-bold">
            {users.length} {users.length === 1 ? "Person" : "People"} Online
          </span>
        </div>
      </div>

      {!localStream && (
        <button
          onClick={() => {
            console.log("Button clicked!");
            startLocalStream();
          }}
          className="mb-4 w-full bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 cursor-pointer"
        >
          Join Voice Call
        </button>
      )}

      <h1 className="text-2xl font-bold mb-4">Chat:</h1>
      <div className="flex-grow border border-gray-300 rounded-lg p-4 overflow-y-auto mb-4 bg-gray-50">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <strong>
              {msg.authorName === username ? "You" : msg.authorName}
            </strong>
            : <span>{msg.text}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="flex">
        <input
          type="text"
          placeholder="Type your message..."
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          className="flex-grow border border-gray-300 rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          Send
        </button>
      </form>

      {localStream && (
        <audio
          ref={(audio) => {
            if (audio) audio.srcObject = localStream;
          }}
          autoPlay
          muted
        />
      )}

      {Object.values(remoteStreams).map((stream, index) => {
        return (
          <audio
            key={index}
            ref={(audio) => {
              if (audio) audio.srcObject = stream;
            }}
            autoPlay
          />
        );
      })}
    </div>
  );
};

export default RoomPage;
