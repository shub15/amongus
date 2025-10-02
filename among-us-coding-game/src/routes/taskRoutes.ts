import { Router } from "express";
import { TaskController } from "../controllers/taskController";
import { Application } from "express";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const taskController = new TaskController();

export const setTaskRoutes = (app: Application): void => {
  app.use("/api/tasks", router);

  // Protected routes
  router.post("/assign", authenticateToken, taskController.assignTask);
  router.post("/submit", authenticateToken, taskController.submitTask);
  router.get("/player/:playerId", authenticateToken, taskController.getTasks);
  router.get("/:taskId", authenticateToken, taskController.getTaskById);
};
