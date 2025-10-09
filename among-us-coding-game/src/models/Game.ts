import mongoose, { Schema, Document } from "mongoose";

// Define the map structure
export interface IRoom {
  name: string;
  displayName: string;
  adjacentRooms: string[]; // Names of rooms that can be moved to from this room
  ventsTo: string[]; // Names of rooms that can be vented to from this room (for impostors)
  tasks: string[]; // Task IDs available in this room
  position: { x: number; y: number }; // Position on the map for UI
}

export interface ITask {
  taskId: string;
  description: string;
  assignedTo: string;
  status: "pending" | "completed" | "failed";
  question: string; // Technical question
  answer: string; // Correct answer
  options: string[]; // Multiple choice options
  isEmergency?: boolean; // Flag for emergency tasks
  deadline?: Date; // Deadline for emergency tasks
  completedAt?: Date; // When the task was completed
}

export interface IPlayer {
  playerId: string;
  name: string;
  role: "crewmate" | "imposter" | "ghost";
  status: "alive" | "dead" | "disconnected";
  isOnline: boolean;
  tasks: string[];
  completedTasks: string[];
  votes: string[];
  hasVoted: boolean;
  currentRoom: string;
  lastKillTime: Date | null;
  isVenting: boolean;
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
  map: IRoom[]; // The game map
  killCooldown: number; // Cooldown time for kills in seconds
  ventCooldown: number; // Cooldown time for venting in seconds
  sabotageDeadline: Date | null; // Deadline for emergency sabotage task
  emergencyTaskId: string | null; // ID of current emergency task
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
        currentRoom: { type: String, default: "cafeteria" },
        lastKillTime: { type: Date, default: null },
        isVenting: { type: Boolean, default: false },
      },
    ],
    default: [],
  },
  tasks: {
    type: [
      {
        taskId: String,
        description: String,
        assignedTo: String,
        status: { type: String, enum: ["pending", "completed", "failed"] },
        question: String,
        answer: String,
        options: [String],
        isEmergency: Boolean,
        deadline: Date,
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
  map: {
    type: [
      {
        name: String,
        displayName: String,
        adjacentRooms: [String],
        ventsTo: [String],
        tasks: [String], // Task IDs available in this room
        position: {
          x: Number,
          y: Number,
        },
      },
    ],
    default: [
      // Among Us Skeld map layout - Cafeteria in center-top
      {
        name: "cafeteria",
        displayName: "Cafeteria",
        adjacentRooms: ["weapons", "admin", "medbay", "upper_engine"],
        ventsTo: [],
        tasks: [], // Will be populated with task IDs
        position: { x: 2, y: 0 }, // Center top
      },
      {
        name: "weapons",
        displayName: "Weapons",
        adjacentRooms: ["cafeteria", "o2", "navigation"],
        ventsTo: ["navigation"],
        tasks: [], // Will be populated with task IDs
        position: { x: 4, y: 0 }, // Top right
      },
      {
        name: "o2",
        displayName: "O2",
        adjacentRooms: ["weapons", "navigation", "shields"],
        ventsTo: ["shields"],
        tasks: [], // Will be populated with task IDs
        position: { x: 4, y: 1 }, // Right side, middle-top
      },
      {
        name: "navigation",
        displayName: "Navigation",
        adjacentRooms: ["weapons", "o2", "shields"],
        ventsTo: ["weapons"],
        tasks: [], // Will be populated with task IDs
        position: { x: 5, y: 1 }, // Far right, middle
      },
      {
        name: "shields",
        displayName: "Shields",
        adjacentRooms: ["navigation", "o2", "storage"],
        ventsTo: ["navigation"],
        tasks: [], // Will be populated with task IDs
        position: { x: 4, y: 2 }, // Right side, middle-bottom
      },
      {
        name: "communications",
        displayName: "Communications",
        adjacentRooms: ["storage", "shields"],
        ventsTo: [],
        tasks: [], // Will be populated with task IDs
        position: { x: 4, y: 3 }, // Right side, bottom
      },
      {
        name: "storage",
        displayName: "Storage",
        adjacentRooms: [
          "communications",
          "shields",
          "admin",
          "electrical",
          "lower_engine",
        ],
        ventsTo: ["electrical", "admin"],
        tasks: [], // Will be populated with task IDs
        position: { x: 3, y: 2 }, // Center-right, middle
      },
      {
        name: "admin",
        displayName: "Admin",
        adjacentRooms: ["cafeteria", "storage", "electrical"],
        ventsTo: ["electrical"],
        tasks: [], // Will be populated with task IDs
        position: { x: 2, y: 1 }, // Center, below cafeteria
      },
      {
        name: "electrical",
        displayName: "Electrical",
        adjacentRooms: ["storage", "lower_engine", "security"],
        ventsTo: ["security", "medbay"],
        tasks: [], // Will be populated with task IDs
        position: { x: 2, y: 2 }, // Center, middle
      },
      {
        name: "lower_engine",
        displayName: "Lower Engine",
        adjacentRooms: ["storage", "electrical", "security", "reactor"],
        ventsTo: [],
        tasks: [], // Will be populated with task IDs
        position: { x: 3, y: 3 }, // Center-right, bottom
      },
      {
        name: "security",
        displayName: "Security",
        adjacentRooms: [
          "electrical",
          "lower_engine",
          "reactor",
          "upper_engine",
        ],
        ventsTo: ["electrical", "medbay"],
        tasks: [], // Will be populated with task IDs
        position: { x: 2, y: 3 }, // Center, bottom
      },
      {
        name: "reactor",
        displayName: "Reactor",
        adjacentRooms: ["security", "lower_engine", "upper_engine"],
        ventsTo: [],
        tasks: [], // Will be populated with task IDs
        position: { x: 1, y: 3 }, // Center-left, bottom
      },
      {
        name: "upper_engine",
        displayName: "Upper Engine",
        adjacentRooms: ["reactor", "security", "medbay", "cafeteria"],
        ventsTo: [],
        tasks: [], // Will be populated with task IDs
        position: { x: 1, y: 2 }, // Center-left, middle
      },
      {
        name: "medbay",
        displayName: "Medbay",
        adjacentRooms: ["upper_engine", "cafeteria"],
        ventsTo: ["electrical", "security"],
        tasks: [], // Will be populated with task IDs
        position: { x: 1, y: 1 }, // Center-left, middle-top
      },
    ],
  },
  killCooldown: { type: Number, default: 30 }, // 30 seconds cooldown
  ventCooldown: { type: Number, default: 15 }, // 15 seconds cooldown
  sabotageDeadline: { type: Date, default: null },
  emergencyTaskId: { type: String, default: null },
});

// Add indexes for better query performance
GameSchema.index({ gameId: 1 });
GameSchema.index({ "players.playerId": 1 });
GameSchema.index({ "tasks.taskId": 1 });
GameSchema.index({ gameStatus: 1 });
GameSchema.index({ emergencyTaskId: 1 });

const Game = mongoose.model<IGame>("Game", GameSchema);

export default Game;
