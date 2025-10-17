import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const mongoUri = process.env.MONGO_URI as string;
mongoose.connect(mongoUri)
  .then(()=> console.log("connected to mongo db"))
  .catch(err => console.error("could not connect to mongdb", err));
app.use(cors());
app.use(express.json());
const server = http.createServer(app);

app.get("/", (req, res) => res.send("Hush Server running!"));


const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

