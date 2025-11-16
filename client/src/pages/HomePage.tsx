import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL;

const HomePage = () => {
  const navigate = useNavigate();
  // state to hold the room code the user is typing
  const [joinCode, setJoinCode] = useState("");

  const handleCreateRoom = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rooms`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      navigate(`/room/${data.roomId}`);
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  // handles joining with a code
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/room/${joinCode.trim()}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md text-center">
        
        <h1 className="text-5xl font-bold text-white mb-2">
          Hush
        </h1>
        <p className="text-lg text-gray-300 mb-12">
          one-time end-to-end encrypted anonymous chats
        </p>

        <form onSubmit={handleJoinRoom} className="mb-6">
          <label className="text-left block text-gray-300 mb-2">
            Join private chat
          </label>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter chat code or link to join..."
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </form>

        <div className="flex items-center justify-center mb-6">
          <span className="text-gray-500">or</span>
        </div>


        <button
          onClick={handleCreateRoom}
          className="w-full p-3 bg-white text-gray-900 font-bold rounded-lg mb-8 hover:bg-gray-200 transition-colors cursor-pointer"
        >
          Start new private chat
        </button>
              
        <p className="text-xs text-gray-500">
          Messages are end-to-end encrypted and never stored
        </p>
        
      </div>
    </div>
  );
};

export default HomePage;