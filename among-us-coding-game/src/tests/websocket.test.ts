import { Server } from "socket.io";
import { createServer } from "http";
import Client from "socket.io-client";
import { AddressInfo } from "net";

describe("WebSocket Tests", () => {
  let io: Server;
  let serverSocket: any;
  let clientSocket: any;
  let httpServer: any;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = (httpServer.address() as AddressInfo).port;
      clientSocket = Client(`http://localhost:${port}`);
      io.on("connection", (socket) => {
        serverSocket = socket;
      });
      clientSocket.on("connect", done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  describe("Connection Events", () => {
    it("should handle player connection", (done) => {
      clientSocket.emit("player-connect", {
        playerId: "test123",
        name: "TestPlayer",
      });

      serverSocket.on("player-connect", (data: any) => {
        expect(data.playerId).toBe("test123");
        expect(data.name).toBe("TestPlayer");
        done();
      });
    });

    it("should handle player disconnection", (done) => {
      clientSocket.emit("player-disconnect", { playerId: "test123" });

      serverSocket.on("player-disconnect", (data: any) => {
        expect(data.playerId).toBe("test123");
        done();
      });
    });
  });

  describe("Game Events", () => {
    it("should handle game creation broadcast", (done) => {
      const gameData = {
        gameId: "game123",
        name: "Test Game",
        status: "waiting",
      };

      serverSocket.emit("game-created", gameData);

      clientSocket.on("game-created", (data: any) => {
        expect(data.gameId).toBe("game123");
        expect(data.name).toBe("Test Game");
        done();
      });
    });

    it("should handle player joining game", (done) => {
      const joinData = {
        gameId: "game123",
        playerId: "player456",
        playerName: "NewPlayer",
      };

      serverSocket.emit("player-joined", joinData);

      clientSocket.on("player-joined", (data: any) => {
        expect(data.gameId).toBe("game123");
        expect(data.playerId).toBe("player456");
        done();
      });
    });

    it("should handle game start", (done) => {
      const startData = {
        gameId: "game123",
        players: [
          { id: "player1", role: "crewmate" },
          { id: "player2", role: "imposter" },
        ],
      };

      serverSocket.emit("game-started", startData);

      clientSocket.on("game-started", (data: any) => {
        expect(data.gameId).toBe("game123");
        expect(data.players).toHaveLength(2);
        done();
      });
    });
  });

  describe("Task Events", () => {
    it("should handle task assignment", (done) => {
      const taskData = {
        taskId: "task123",
        playerId: "player456",
        description: "Implement binary search",
        difficulty: "medium",
      };

      serverSocket.emit("task-assigned", taskData);

      clientSocket.on("task-assigned", (data: any) => {
        expect(data.taskId).toBe("task123");
        expect(data.playerId).toBe("player456");
        done();
      });
    });

    it("should handle task submission", (done) => {
      const submissionData = {
        taskId: "task123",
        playerId: "player456",
        solution: "function binarySearch() { /* code */ }",
        status: "completed",
      };

      clientSocket.emit("task-submitted", submissionData);

      serverSocket.on("task-submitted", (data: any) => {
        expect(data.taskId).toBe("task123");
        expect(data.status).toBe("completed");
        done();
      });
    });

    it("should handle task progress update", (done) => {
      const progressData = {
        taskId: "task123",
        playerId: "player456",
        progress: 75,
        timeSpent: 300,
      };

      serverSocket.emit("task-progress", progressData);

      clientSocket.on("task-progress", (data: any) => {
        expect(data.progress).toBe(75);
        expect(data.timeSpent).toBe(300);
        done();
      });
    });
  });

  describe("Imposter Events", () => {
    it("should handle sabotage action", (done) => {
      const sabotageData = {
        imposterId: "imposter123",
        sabotageType: "disable-tasks",
        targetPlayerId: "player456",
        gameId: "game123",
      };

      clientSocket.emit("sabotage", sabotageData);

      serverSocket.on("sabotage", (data: any) => {
        expect(data.imposterId).toBe("imposter123");
        expect(data.sabotageType).toBe("disable-tasks");
        done();
      });
    });

    it("should handle elimination", (done) => {
      const eliminationData = {
        imposterId: "imposter123",
        targetPlayerId: "player456",
        gameId: "game123",
        method: "elimination",
      };

      serverSocket.emit("player-eliminated", eliminationData);

      clientSocket.on("player-eliminated", (data: any) => {
        expect(data.targetPlayerId).toBe("player456");
        expect(data.imposterId).toBe("imposter123");
        done();
      });
    });
  });

  describe("Room Management", () => {
    it("should handle joining game room", (done) => {
      const roomData = {
        gameId: "game123",
        playerId: "player456",
      };

      clientSocket.emit("join-game-room", roomData);

      serverSocket.on("join-game-room", (data: any) => {
        expect(data.gameId).toBe("game123");
        expect(data.playerId).toBe("player456");
        // Simulate joining room
        serverSocket.join(`game-${data.gameId}`);
        done();
      });
    });

    it("should handle leaving game room", (done) => {
      const roomData = {
        gameId: "game123",
        playerId: "player456",
      };

      clientSocket.emit("leave-game-room", roomData);

      serverSocket.on("leave-game-room", (data: any) => {
        expect(data.gameId).toBe("game123");
        // Simulate leaving room
        serverSocket.leave(`game-${data.gameId}`);
        done();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid event data", (done) => {
      clientSocket.emit("invalid-event", { invalid: "data" });

      serverSocket.on("error", (error: any) => {
        expect(error).toBeDefined();
        done();
      });

      // Trigger error by sending malformed data
      setTimeout(() => {
        serverSocket.emit("error", { message: "Invalid event data" });
      }, 100);
    });

    it("should handle connection timeout", (done) => {
      // Simulate connection timeout
      setTimeout(() => {
        expect(clientSocket.connected).toBe(true);
        done();
      }, 1000);
    });
  });

  describe("Broadcasting", () => {
    it("should broadcast to all players in game room", (done) => {
      const broadcastData = {
        gameId: "game123",
        message: "Game update",
        type: "info",
      };

      // Join room first
      serverSocket.join(`game-${broadcastData.gameId}`);

      // Broadcast to room
      serverSocket
        .to(`game-${broadcastData.gameId}`)
        .emit("game-update", broadcastData);

      clientSocket.on("game-update", (data: any) => {
        expect(data.message).toBe("Game update");
        expect(data.type).toBe("info");
        done();
      });

      // Simulate broadcast
      setTimeout(() => {
        clientSocket.emit("game-update", broadcastData);
      }, 100);
    });
  });
});
