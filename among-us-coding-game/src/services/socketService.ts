import { Server, Socket } from "socket.io";
import Game from "../models/Game";
import Player from "../models/Player";

// Utility function to sanitize game data for a specific player
export const sanitizeGameForPlayer = (game: any, playerId: string) => {
  // Handle both Mongoose documents and plain objects
  const gameObj = game.toObject ? game.toObject() : game;

  // Create a sanitized version of the game data
  const sanitizedGame = {
    ...gameObj,
    players: gameObj.players.map((player: any) => {
      // For the requesting player, send their own role
      if (player.playerId === playerId) {
        return {
          ...player,
          role: player.role || "unknown",
        };
      }
      // For other players, hide their role but preserve other properties
      return {
        playerId: player.playerId,
        name: player.name,
        status: player.status,
        isOnline: player.isOnline,
        tasks: player.tasks || [],
        completedTasks: player.completedTasks || [],
        votes: player.votes || [],
        hasVoted: player.hasVoted || false,
        role: "unknown", // Hide role from other players
      };
    }),
  };

  return sanitizedGame;
};

// Utility function to sanitize game data for all players (used for broadcasting)
export const sanitizeGameForBroadcast = (game: any) => {
  // Handle both Mongoose documents and plain objects
  const gameObj = game.toObject ? game.toObject() : game;

  // Create a sanitized version of the game data where all roles are hidden
  const sanitizedGame = {
    ...gameObj,
    players: gameObj.players.map((player: any) => ({
      playerId: player.playerId,
      name: player.name,
      status: player.status,
      isOnline: player.isOnline,
      tasks: player.tasks || [],
      completedTasks: player.completedTasks || [],
      votes: player.votes || [],
      hasVoted: player.hasVoted || false,
      role: "unknown", // Hide role from all players
    })),
  };

  return sanitizedGame;
};

// Create a singleton instance
let ioInstance: Server | null = null;

class SocketService {
  private io: Server;

  constructor(server: any) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || [
          "http://localhost:3000",
          "http://localhost:3001", // Added frontend dev server port
          "http://127.0.0.1:3000",
          "http://127.0.0.1:3001", // Added frontend dev server port
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
      },
      transports: ["websocket", "polling"], // Allow both transports as fallback
      allowEIO3: true,
      pingInterval: 25000,
      pingTimeout: 20000, // Increased timeout
    });

    // Store the instance for global access
    ioInstance = this.io;

    this.initializeSocketEvents();
  }

  private initializeSocketEvents() {
    this.io.on("connection", (socket: Socket) => {
      console.log("A user connected: " + socket.id);

      // Player joins a game room
      socket.on(
        "joinGame",
        async (data: { gameId: string; playerId: string }, callback: any) => {
          try {
            const { gameId, playerId } = data;
            console.log(
              "Player joining game:",
              gameId,
              "with player ID:",
              playerId
            );

            // Join the game room
            socket.join(gameId);

            // Also join the player's individual room for personalized events
            socket.join(playerId);

            // Update player's online status
            const updatedPlayer = await Player.findOneAndUpdate(
              { playerId },
              { isOnline: true },
              { new: true }
            );
            console.log(
              "Player online status updated:",
              updatedPlayer?.isOnline
            );

            // Notify others in the game room
            socket.to(gameId).emit("playerConnected", { playerId });

            console.log(`Player ${playerId} joined game ${gameId}`);

            // Acknowledge the callback
            if (callback) callback({ status: "success" });
          } catch (error) {
            console.error("Error joining game:", error);
            if (callback)
              callback({ status: "error", message: "Failed to join game" });
          }
        }
      );

      // Player leaves a game room
      socket.on(
        "leaveGame",
        async (data: { gameId: string; playerId: string }, callback: any) => {
          try {
            const { gameId, playerId } = data;
            console.log(
              "Player leaving game:",
              gameId,
              "with player ID:",
              playerId
            );

            // Leave the game room
            socket.leave(gameId);

            // Also leave the player's individual room
            socket.leave(playerId);

            // Update player's online status
            const updatedPlayer = await Player.findOneAndUpdate(
              { playerId },
              { isOnline: false },
              { new: true }
            );
            console.log(
              "Player online status updated:",
              updatedPlayer?.isOnline
            );

            // Notify others in the game room
            socket.to(gameId).emit("playerDisconnected", { playerId });

            console.log(`Player ${playerId} left game ${gameId}`);

            // Acknowledge the callback
            if (callback) callback({ status: "success" });
          } catch (error) {
            console.error("Error leaving game:", error);
            if (callback)
              callback({ status: "error", message: "Failed to leave game" });
          }
        }
      );

      // Player completes a task
      socket.on(
        "taskCompleted",
        (data: { gameId: string; taskId: string; playerId: string }) => {
          console.log("Task completed:", data);
          this.io.to(data.gameId).emit("taskUpdate", data);
        }
      );

      // Impostor sabotage
      socket.on(
        "sabotage",
        (data: { gameId: string; sabotageType: string; playerId: string }) => {
          console.log("Sabotage initiated:", data);
          this.io.to(data.gameId).emit("sabotageAlert", data);
        }
      );

      // Player calls a meeting
      socket.on(
        "callMeeting",
        (data: { gameId: string; playerId: string; reason: string }) => {
          console.log("Meeting called:", data);
          this.io.to(data.gameId).emit("meetingCalled", data);
        }
      );

      // Player votes
      socket.on(
        "vote",
        (data: { gameId: string; voterId: string; votedPlayerId: string }) => {
          console.log("Vote recorded:", data);
          this.io.to(data.gameId).emit("voteRecorded", data);
        }
      );

      // Player sends chat message
      socket.on(
        "chatMessage",
        (data: { gameId: string; playerId: string; message: string }) => {
          console.log("Chat message:", data);
          this.io.to(data.gameId).emit("newChatMessage", data);
        }
      );

      // Player updates their position (for map tracking)
      socket.on(
        "updatePosition",
        (data: {
          gameId: string;
          playerId: string;
          position: { x: number; y: number };
        }) => {
          console.log("Position update:", data);
          // Broadcast to all other players in the game
          socket.to(data.gameId).emit("playerPositionUpdate", data);
        }
      );

      // Player reports a dead body
      socket.on(
        "reportBody",
        (data: {
          gameId: string;
          reporterId: string;
          deadPlayerId: string;
        }) => {
          console.log("Body reported:", data);
          this.io.to(data.gameId).emit("bodyReported", data);
        }
      );

      // Handle disconnection
      socket.on("disconnect", (reason) => {
        console.log("User disconnected: " + socket.id + ", reason: " + reason);
        // Note: We can't easily determine which game the player was in
        // This would require storing socket.id -> gameId mapping
      });
    });
  }

  // Utility method to emit events to a specific game room
  public emitToGame(
    gameId: string,
    event: string,
    data: any,
    game?: any,
    requestingPlayerId?: string
  ) {
    // If we have game data and a requesting player ID, sanitize the data
    let sanitizedData = data;
    if (game && requestingPlayerId && event === "gameUpdate") {
      sanitizedData = sanitizeGameForPlayer(game, requestingPlayerId);
    } else if (game && !requestingPlayerId && event === "gameUpdate") {
      sanitizedData = sanitizeGameForBroadcast(game);
    }

    console.log(
      "Emitting to game:",
      gameId,
      "event:",
      event,
      "data:",
      sanitizedData
    );
    this.io.to(gameId).emit(event, sanitizedData);
  }

  // Utility method to emit events to a specific player with game data sanitization
  public emitToPlayerWithGame(playerId: string, event: string, game: any) {
    const sanitizedGame = sanitizeGameForPlayer(game, playerId);
    console.log(
      "Emitting to player:",
      playerId,
      "event:",
      event,
      "data:",
      sanitizedGame
    );
    this.io.to(playerId).emit(event, sanitizedGame);
  }

  // Utility method to emit events to a specific player
  public emitToPlayer(socketId: string, event: string, data: any) {
    console.log(
      "Emitting to player:",
      socketId,
      "event:",
      event,
      "data:",
      data
    );
    this.io.to(socketId).emit(event, data);
  }
}

// Export a function to get the io instance
export const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error("SocketService not initialized");
  }
  return ioInstance;
};

export default SocketService;
