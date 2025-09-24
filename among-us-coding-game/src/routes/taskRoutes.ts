import { Router } from "express";
import { TaskController } from "../controllers/taskController";
import { Application } from "express";

const router = Router();
const taskController = new TaskController();

interface TaskRoutes {
    setTaskRoutes(app: Application): void;
}

export const setTaskRoutes = (app: Application): void => {
    app.use("/api/tasks", router);

    router.post("/assign", taskController.assignTask.bind(taskController));
    router.post("/submit", taskController.submitTask.bind(taskController));
    router.get("/", taskController.getTasks.bind(taskController));
};
