// Simple test to verify the backend is working
console.log("Backend verification test");

// Import required modules
import mongoose from "mongoose";
import Game from "./src/models/Game";
import Player from "./src/models/Player";
import { TaskModel } from "./src/models/Task";

// Test database connection
const testConnection = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/among-us-coding-game"
    );
    console.log("MongoDB connected successfully");

    // Test creating a player
    const testPlayer = new Player({
      playerId: "test_player_123",
      name: "Test Player",
      role: "crewmate",
      status: "alive",
      isOnline: true,
      tasks: [],
      completedTasks: [],
      votes: [],
      hasVoted: false,
      isImpostor: false,
    });

    await testPlayer.save();
    console.log("Player created successfully:", testPlayer.name);

    // Test creating a game
    const testGame = new Game({
      gameId: "test_game_123",
      players: [],
      tasks: [],
      gameStatus: "waiting",
      imposterCount: 1,
      currentSabotage: null,
      votes: {},
      voteHistory: [],
      deadPlayers: [],
      meetingCalledBy: null,
      createdAt: new Date(),
      startedAt: null,
      endedAt: null,
      winner: null,
    });

    await testGame.save();
    console.log("Game created successfully:", testGame.gameId);

    // Test creating a task
    const testTask = new TaskModel({
      taskId: "test_task_123",
      description: "Test technical question",
      assignedTo: testPlayer.playerId,
      status: "pending",
      question: "What is the time complexity of binary search?",
      answer: "O(log n)",
      options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
      category: "Algorithms",
      difficulty: "medium",
      createdAt: new Date(),
      completedAt: null,
    });

    await testTask.save();
    console.log("Task created successfully:", testTask.description);

    // Clean up test data
    await Player.deleteOne({ playerId: "test_player_123" });
    await Game.deleteOne({ gameId: "test_game_123" });
    await TaskModel.deleteOne({ taskId: "test_task_123" });

    console.log("Test data cleaned up successfully");

    // Close connection
    await mongoose.connection.close();
    console.log("Database connection closed");

    console.log("All tests passed!");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
};

// Run the test
testConnection();
