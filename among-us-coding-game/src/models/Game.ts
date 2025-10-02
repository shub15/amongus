import mongoose, { Schema, Document } from "mongoose";

interface ITask {
  taskId: string;
  description: string;
  assignedTo: string;
  status: "pending" | "completed" | "failed";
  question: string; // Technical question
  answer: string; // Correct answer
  options: string[]; // Multiple choice options
}

interface IPlayer {
  playerId: string;
  name: string;
  role: "crewmate" | "imposter" | "ghost";
  status: "alive" | "dead" | "disconnected";
  isOnline: boolean;
  tasks: string[];
  completedTasks: string[];
  votes: string[];
  hasVoted: boolean;
}

export interface IGame extends Document {
  gameId: string;
  players: IPlayer[];
  tasks: ITask[];
  gameStatus: "waiting" | "in-progress" | "discussion" | "voting" | "ended";
  imposterCount: number;
  currentSabotage: string | null; // Current sabotage type if any
  votes: Map<string, string>; // Map of voterId -> votedPlayerId
  voteHistory: Array<{ round: number; votes: Map<string, string> }>;
  deadPlayers: string[]; // Array of dead player IDs
  meetingCalledBy: string | null; // Player who called the meeting
  createdAt: Date;
  startedAt: Date | null;
  endedAt: Date | null;
  winner: "crewmates" | "impostors" | null;
}

const GameSchema: Schema = new Schema({
  gameId: { type: String, unique: true, required: true, index: true },
  players: {
    type: [
      {
        playerId: { type: String, index: true },
        name: String,
        role: { type: String, enum: ["crewmate", "imposter", "ghost"] },
        status: { type: String, enum: ["alive", "dead", "disconnected"] },
        isOnline: Boolean,
        tasks: [String],
        completedTasks: [String],
        votes: [String],
        hasVoted: Boolean,
      },
    ],
    default: [],
  },
  tasks: {
    type: [
      {
        taskId: { type: String, index: true },
        description: String,
        assignedTo: String,
        status: { type: String, enum: ["pending", "completed", "failed"] },
        question: String,
        answer: String,
        options: [String],
      },
    ],
    default: [],
  },
  gameStatus: {
    type: String,
    required: true,
    enum: ["waiting", "in-progress", "discussion", "voting", "ended"],
    default: "waiting",
    index: true,
  },
  imposterCount: { type: Number, default: 1 },
  currentSabotage: { type: String, default: null },
  votes: { type: Map, of: String, default: {} },
  voteHistory: {
    type: [
      {
        round: Number,
        votes: { type: Map, of: String },
      },
    ],
    default: [],
  },
  deadPlayers: [{ type: String }],
  meetingCalledBy: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  startedAt: { type: Date, default: null },
  endedAt: { type: Date, default: null },
  winner: {
    type: String,
    enum: ["crewmates", "impostors", null],
    default: null,
  },
});

// Add indexes for better query performance
GameSchema.index({ gameId: 1 });
GameSchema.index({ "players.playerId": 1 });
GameSchema.index({ "tasks.taskId": 1 });
GameSchema.index({ gameStatus: 1 });

const Game = mongoose.model<IGame>("Game", GameSchema);

export default Game;
