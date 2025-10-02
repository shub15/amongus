import express from "express";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { setGameRoutes } from "./routes/gameRoutes";
import { setPlayerRoutes } from "./routes/playerRoutes";
import { setTaskRoutes } from "./routes/taskRoutes";
import SocketService from "./services/socketService";
import connectDB from "./config/database";
import { startSabotageChecker } from "./controllers/gameController";

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Optimize HTTP server settings
server.keepAliveTimeout = 65000; // Ensure keep alive timeout is greater than load balancer timeout
server.headersTimeout = 66000; // Ensure headers timeout is greater than keep alive timeout

// CORS configuration for REST API
const corsOptions = {
  origin: process.env.CLIENT_URL || [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
  maxAge: 86400, // Cache preflight requests for 24 hours
};

// Middleware with optimized settings
app.use(express.json({ limit: "5mb" })); // Reduced limit
app.use(express.urlencoded({ extended: true, limit: "5mb" })); // Reduced limit
app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// Initialize database connection
connectDB();

// WebSocket setup
const socketService = new SocketService(server);

// Routes
setGameRoutes(app);
setPlayerRoutes(app);
setTaskRoutes(app);

// Start the sabotage checker
startSabotageChecker();

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 3000;

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

export { server, socketService };
