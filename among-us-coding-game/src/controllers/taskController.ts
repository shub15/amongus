import { Request, Response } from "express";
import { TaskModel } from "../models/Task";
import Player from "../models/Player";

export class TaskController {
  async assignTask(req: Request, res: Response) {
    try {
      const { playerId, taskData } = req.body;

      // Create a new task
      const taskId = `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const task = new TaskModel({
        taskId,
        ...taskData,
      });

      await task.save();

      // Add task to player
      await Player.findOneAndUpdate({ playerId }, { $push: { tasks: taskId } });

      res.status(201).json({ message: "Task assigned successfully", task });
    } catch (error) {
      res.status(500).json({ message: "Error assigning task", error });
    }
  }

  async submitTask(req: Request, res: Response) {
    try {
      const { taskId, playerId, answer } = req.body;

      // Find the task
      const task = await TaskModel.findOne({ taskId });
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check if task is already completed
      if (task.status === "completed") {
        return res.status(400).json({ message: "Task already completed" });
      }

      // Verify the answer
      const isCorrect = task.answer.toLowerCase() === answer.toLowerCase();

      // Update task status
      task.status = isCorrect ? "completed" : "failed";
      if (isCorrect) {
        task.completedAt = new Date();
      }

      await task.save();

      // Update player's completed tasks if correct
      if (isCorrect) {
        await Player.findOneAndUpdate(
          { playerId },
          { $push: { completedTasks: taskId } }
        );
      }

      res.status(200).json({
        message: isCorrect ? "Task completed successfully" : "Incorrect answer",
        isCorrect,
        task,
      });
    } catch (error) {
      res.status(500).json({ message: "Error submitting task", error });
    }
  }

  async getTasks(req: Request, res: Response) {
    try {
      const { playerId } = req.params;

      // Find player
      const player = await Player.findOne({ playerId });
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      // Get player's tasks
      const tasks = await TaskModel.find({ taskId: { $in: player.tasks } });

      res.status(200).json({ tasks });
    } catch (error) {
      res.status(500).json({ message: "Error retrieving tasks", error });
    }
  }

  async getTaskById(req: Request, res: Response) {
    try {
      const { taskId } = req.params;

      const task = await TaskModel.findOne({ taskId });
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.status(200).json(task);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving task", error });
    }
  }
}
