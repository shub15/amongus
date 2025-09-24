import { TaskModel } from "../models/Task";
import type { Task } from "../models/Task";
import { Player } from "../types";

export class TaskService {
  async assignTaskService(player: Player): Promise<Task> {
    // Logic to assign a task to a player
    const task = new TaskModel({
      // Example task properties
      taskId: this.generateTaskId(),
      description: "Complete the coding challenge",
      assignedTo: player.playerId,
      status: "assigned",
    });
    await task.save();
    return task;
  }

  async submitTaskService(
    taskId: string,
    playerId: string
  ): Promise<Task | null> {
    // Logic to submit a task
    const task = await TaskModel.findOne({ taskId, assignedTo: playerId });
    if (task) {
      task.status = "completed";
      await task.save();
      return task;
    }
    return null;
  }

  private generateTaskId(): string {
    // Logic to generate a unique task ID
    return "task-" + Math.random().toString(36).substr(2, 9);
  }
}
