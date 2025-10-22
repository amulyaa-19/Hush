import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { connectDB } from "./config/database.js";
import { initializeSocketIO } from "./socket/socketHandler.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
initializeSocketIO(server);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Hush Server running!"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

