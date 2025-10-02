import { Schema, model, Document } from "mongoose";

export interface ITask extends Document {
  taskId: string;
  description: string;
  assignedTo: string;
  status: "pending" | "completed" | "failed";
  question: string; // Technical question
  answer: string; // Correct answer
  options: string[]; // Multiple choice options
  category: string; // Category of the technical question (e.g., JavaScript, Python, etc.)
  difficulty: "easy" | "medium" | "hard"; // Difficulty level
  createdAt: Date;
  completedAt: Date | null;
}

const taskSchema = new Schema<ITask>(
  {
    taskId: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    assignedTo: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
      index: true,
    },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    options: [{ type: String }], // Multiple choice options
    category: { type: String, required: true, index: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
taskSchema.index({ taskId: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ category: 1 });

export const TaskModel = model<ITask>("Task", taskSchema);
