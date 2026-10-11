import cors from "cors";
import express from "express";
import folderRoutes from "./routes/folder.routes";
import todoRoutes from "./routes/todo.routes";
import env from "dotenv";

env.config()

const app = express();


app.use(cors({
  origin: [
    process.env.FRONTEND_URL || process.env.VITE_URL || "http://localhost:5173",
    "https://task-board-lime-seven.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok"
  });
});

app.use("/api/folders", folderRoutes);
app.use("/api/todos", todoRoutes);

export default app;