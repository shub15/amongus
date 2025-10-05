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
          "http://localhost:3001",
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
      },
      transports: ["websocket"], // Prefer websocket over polling
      allowEIO3: true,
      pingInterval: 25000, // Increased ping interval
      pingTimeout: 5000, // Reduced ping timeout
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

      // Player moves to a new room
      socket.on(
        "moveToRoom",
        async (data: {
          gameId: string;
          playerId: string;
          roomName: string;
        }) => {
          try {
            const { gameId, playerId, roomName } = data;
            console.log("Player moving to room:", playerId, roomName);

            // Update player's current room
            const updatedPlayer = await Player.findOneAndUpdate(
              { playerId },
              { currentRoom: roomName },
              { new: true }
            );

            if (updatedPlayer) {
              // Notify all players in the game about the move
              this.io.to(gameId).emit("playerMoved", {
                playerId,
                playerName: updatedPlayer.name,
                roomName,
              });
            }
          } catch (error) {
            console.error("Error moving player:", error);
          }
        }
      );

      // Player uses vent to move
      socket.on(
        "useVent",
        async (data: {
          gameId: string;
          playerId: string;
          targetRoom: string;
        }) => {
          try {
            const { gameId, playerId, targetRoom } = data;
            console.log("Player using vent:", playerId, targetRoom);

            // Update player's current room and venting status
            const updatedPlayer = await Player.findOneAndUpdate(
              { playerId },
              { currentRoom: targetRoom, isVenting: true },
              { new: true }
            );

            if (updatedPlayer) {
              // Notify all players in the game about the vent move
              this.io.to(gameId).emit("playerVentMove", {
                playerId,
                playerName: updatedPlayer.name,
                targetRoom,
              });

              // Reset venting status after a short delay
              setTimeout(async () => {
                await Player.updateOne({ playerId }, { isVenting: false });
              }, 2000);
            }
          } catch (error) {
            console.error("Error using vent:", error);
          }
        }
      );

      // Impostor kills a player
      socket.on(
        "killPlayer",
        async (data: {
          gameId: string;
          killerId: string;
          targetId: string;
        }) => {
          try {
            const { gameId, killerId, targetId } = data;
            console.log("Player killed:", killerId, "killed", targetId);

            // Update target player's status to dead
            const updatedTarget = await Player.findOneAndUpdate(
              { playerId: targetId },
              { status: "dead" },
              { new: true }
            );

            // Update killer's last kill time
            const updatedKiller = await Player.findOneAndUpdate(
              { playerId: killerId },
              { lastKillTime: new Date() },
              { new: true }
            );

            if (updatedTarget && updatedKiller) {
              // Add to dead players list in game
              await Game.updateOne(
                { gameId, "players.playerId": targetId },
                {
                  $set: { "players.$.status": "dead" },
                  $push: { deadPlayers: targetId },
                }
              );

              // Notify all players in the game about the kill
              this.io.to(gameId).emit("playerKilled", {
                killerId,
                targetId,
                targetName: updatedTarget.name,
                killerName: updatedKiller.name,
              });
            }
          } catch (error) {
            console.error("Error killing player:", error);
          }
        }
      );

      // Player reports a body
      socket.on(
        "reportBody",
        async (data: {
          gameId: string;
          reporterId: string;
          deadPlayerId: string;
        }) => {
          try {
            const { gameId, reporterId, deadPlayerId } = data;
            console.log("Body reported:", reporterId, "reported", deadPlayerId);

            // Get reporter and dead player info
            const reporter = await Player.findOne({ playerId: reporterId });
            const deadPlayer = await Player.findOne({ playerId: deadPlayerId });

            if (reporter && deadPlayer) {
              // Notify all players in the game about the body report
              this.io.to(gameId).emit("bodyReported", {
                reporterId,
                reporterName: reporter.name,
                deadPlayerId,
                deadPlayerName: deadPlayer.name,
                roomName: deadPlayer.currentRoom,
              });
            }
          } catch (error) {
            console.error("Error reporting body:", error);
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

      // Handle disconnection
      socket.on("disconnect", (reason) => {
        console.log("User disconnected: " + socket.id + ", reason: " + reason);
        // Note: We can't easily determine which game the player was in
        // This would require storing socket.id -> gameId mapping
      });
    });
  }

  // Utility method to emit events to a specific game room
  public emitToGame(gameId: string, event: string, data: any) {
    console.log("Emitting to game:", gameId, "event:", event, "data:", data);
    this.io.to(gameId).emit(event, data);
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
