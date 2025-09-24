import express from "express";
import request from "supertest";
import { setGameRoutes } from "../../routes/gameRoutes";
import { setPlayerRoutes } from "../../routes/playerRoutes";
import { setTaskRoutes } from "../../routes/taskRoutes";

export const createTestApp = () => {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  setGameRoutes(app);
  setPlayerRoutes(app);
  setTaskRoutes(app);

  // Health check
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "Server is running" });
  });

  return app;
};

export const makeRequest = (app: express.Application) => {
  return request(app);
};

export const createMockGame = () => ({
  name: "Test Game",
  maxPlayers: 8,
  taskCount: 5,
});

export const createMockPlayer = () => ({
  name: "TestPlayer",
  role: "crewmate",
});

export const createMockTask = () => ({
  title: "Binary Search Implementation",
  description: "Implement a binary search algorithm in JavaScript",
  difficulty: "medium",
  type: "coding",
  testCases: [
    { input: "[1,2,3,4,5], 3", expectedOutput: "2" },
    { input: "[1,2,3,4,5], 6", expectedOutput: "-1" },
  ],
});
