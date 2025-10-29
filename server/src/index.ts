import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { connectDB } from "./config/database.js";
import { initializeSocketIO } from "./socket/socketHandler.js";
import roomRoutes from "./api/roomRoutes.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
initializeSocketIO(server);

app.use(cors());
app.use(express.json());

app.use('/api/rooms', roomRoutes);

app.get("/", (req, res) => res.send("Hush Server running!"));

const PORT = process.env.PORT || 8000;
server.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

