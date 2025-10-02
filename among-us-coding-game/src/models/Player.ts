import mongoose, { Document, Schema } from "mongoose";

export interface IPlayer extends Document {
  playerId: string;
  name: string;
  role: "crewmate" | "imposter" | "ghost";
  status: "alive" | "dead" | "disconnected";
  isOnline: boolean;
  tasks: string[]; // Array of task IDs assigned to the player
  completedTasks: string[]; // Array of completed task IDs
  votes: string[]; // Array of player IDs this player has voted for
  hasVoted: boolean; // Whether the player has voted in the current round
  isImpostor: boolean; // Whether the player is an imposter
}

const PlayerSchema: Schema = new Schema(
  {
    playerId: { type: String, unique: true, required: true, index: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["crewmate", "imposter", "ghost"],
      default: "crewmate",
      index: true,
    },
    status: {
      type: String,
      enum: ["alive", "dead", "disconnected"],
      default: "alive",
      index: true,
    },
    isOnline: { type: Boolean, default: true, index: true },
    tasks: [{ type: String, index: true }], // Array of task IDs
    completedTasks: [{ type: String }], // Array of completed task IDs
    votes: [{ type: String }], // Array of player IDs voted for
    hasVoted: { type: Boolean, default: false, index: true },
    isImpostor: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
PlayerSchema.index({ playerId: 1 });
PlayerSchema.index({ isOnline: 1 });
PlayerSchema.index({ role: 1 });

const Player = mongoose.model<IPlayer>("Player", PlayerSchema);

export default Player;
