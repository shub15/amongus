import { generateKey } from 'crypto';
import mongoose, { Schema, Document } from 'mongoose';

interface ITask {
    taskId: string;
    description: string;
    assignedTo: string;
    status: string;
}

interface IPlayer {
    playerId: string;
    name: string;
    role: 'imposter' | 'crewmate';
    status: string;
}

export interface IGame extends Document {
    gameId: string;
    players: IPlayer[];
    tasks: ITask[];
    gameStatus: string;
}

const GameSchema: Schema = new Schema({
    gameId: { type: String, unique: true, generateKey: true },
    players: { type: [{ playerId: String, name: String, role: String, status: String }], default: [] },
    tasks: { type: [{ taskId: String, description: String, assignedTo: String, status: String }], default: [] },
    gameStatus: { type: String, required: true, enum: ['waiting', 'in-progress', 'ended'], default: 'waiting' }
});

const Game = mongoose.model<IGame>('Game', GameSchema);

export default Game;