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

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Optimize HTTP server settings
server.keepAliveTimeout = 65000; // Ensure keep alive timeout is greater than load balancer timeout
server.headersTimeout = 66000; // Ensure headers timeout is greater than keep alive timeout

// Get the host IP for LAN access
const HOST = process.env.HOST || "0.0.0.0"; // Listen on all interfaces for LAN access
const PORT = parseInt(process.env.PORT || "3000", 10);

// CORS configuration for REST API - allow LAN access
const corsOptions = {
  origin: process.env.CLIENT_URL || [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    // Allow any LAN IP access
    /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/, // 192.168.x.x range
    /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/, // 10.x.x.x range
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+(:\d+)?$/, // 172.16.x.x - 172.31.x.x range
    // Local network IPs
    `http://${HOST}:${PORT}`,
    `http://localhost:${PORT}`,
    `http://127.0.0.1:${PORT}`,
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

// WebSocket setup with LAN access configuration
const socketService = new SocketService(server);

// Configure Socket.IO to work with LAN
const io = socketService.getIO();
io.engine.generateId = (req) => {
  return require("crypto").randomBytes(20).toString("hex"); // Generate random ID
};

// Routes
setGameRoutes(app);
setPlayerRoutes(app);
setTaskRoutes(app);

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

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);

  // Get the actual IP address for LAN access
  const interfaces = require("os").networkInterfaces();
  Object.keys(interfaces).forEach((interfaceName) => {
    interfaces[interfaceName].forEach((interfaceData: any) => {
      if (interfaceData.family === "IPv4" && !interfaceData.internal) {
        console.log(`LAN Access: http://${interfaceData.address}:${PORT}`);
      }
    });
  });
});

export { server, socketService };
