import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL;

const HomePage = () => {
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rooms`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      navigate(`/room/${data.roomId}`);
    } catch (error) {
      console.error("Failed to create room", error);
    }
  };
  return (
    <div>
      <h1>Home Page</h1>
      <button onClick={handleCreateRoom} className="cursor-pointer border">
        Create New Room
      </button>
    </div>
  );
};

export default HomePage;
