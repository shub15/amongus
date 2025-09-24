export interface Task {
    taskId: string;
    description: string;
    assignedTo: string;
    status: 'pending' | 'completed' | 'failed';
}

import { Schema, model } from 'mongoose';

const taskSchema = new Schema<Task>({
    taskId: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    assignedTo: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' }
});

export const TaskModel = model<Task>('Task', taskSchema);