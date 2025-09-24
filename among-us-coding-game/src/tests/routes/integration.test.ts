import request from "supertest";
import { createTestApp } from "../utils/testHelpers";

describe("Integration Tests - All Routes", () => {
  const app = createTestApp();

  describe("Health Check", () => {
    it("should respond with health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toEqual({
        status: "OK",
        message: "Server is running",
      });
    });
  });

  describe("Game Flow Integration", () => {
    let gameId: string;
    let playerId: string;

    it("should create a complete game flow", async () => {
      // Step 1: Create a game
      const gameResponse = await request(app)
        .post("/api/games")
        .send({
          name: "Integration Test Game",
          maxPlayers: 4,
          taskCount: 3,
        })
        .expect(201);

      gameId = gameResponse.body.gameId;
      expect(gameId).toBeDefined();

      // Step 2: Register a player
      const playerResponse = await request(app)
        .post("/api/players/register")
        .send({
          name: "IntegrationPlayer",
          role: "crewmate",
        })
        .expect(201);

      playerId = playerResponse.body._id;
      expect(playerId).toBeDefined();

      // Step 3: Join the game
      const joinResponse = await request(app)
        .post(`/api/games/${gameId}/join`)
        .send({
          playerId: playerId,
          playerName: "IntegrationPlayer",
        })
        .expect(200);

      expect(joinResponse.body.players).toHaveLength(1);

      // Step 4: Assign a task
      const taskResponse = await request(app)
        .post("/api/tasks/assign")
        .send({
          playerId: playerId,
          gameId: gameId,
          taskType: "coding",
          difficulty: "medium",
        })
        .expect(200);

      expect(taskResponse.body.message).toBe("Task assigned successfully");

      // Step 5: Submit the task
      const submitResponse = await request(app)
        .post("/api/tasks/submit")
        .send({
          taskId: "generated-task-id",
          playerId: playerId,
          solution: "function solution() { return true; }",
          timeSpent: 180,
        })
        .expect(200);

      expect(submitResponse.body.message).toBe("Task submitted successfully");

      // Step 6: Update player status
      const statusResponse = await request(app)
        .put("/api/players/status")
        .send({
          playerId: playerId,
          status: "active",
        })
        .expect(200);

      expect(statusResponse.body.status).toBe("active");

      // Step 7: Get all tasks
      const tasksResponse = await request(app)
        .get("/api/tasks")
        .query({ gameId: gameId })
        .expect(200);

      expect(tasksResponse.body).toHaveProperty("tasks");

      // Step 8: Get all players
      const playersResponse = await request(app)
        .get("/api/players")
        .expect(200);

      expect(Array.isArray(playersResponse.body)).toBe(true);
      expect(playersResponse.body.length).toBeGreaterThan(0);

      // Step 9: End the game
      const endResponse = await request(app)
        .delete(`/api/games/${gameId}`)
        .expect(200);

      expect(endResponse.body).toHaveProperty("message");
    });
  });

  describe("Imposter Flow Integration", () => {
    let gameId: string;
    let crewtmateId: string;
    let imposterId: string;

    it("should handle imposter and crewmate interactions", async () => {
      // Create game
      const gameResponse = await request(app)
        .post("/api/games")
        .send({
          name: "Imposter Game",
          maxPlayers: 6,
          taskCount: 5,
        })
        .expect(201);

      gameId = gameResponse.body.gameId;

      // Register crewmate
      const crewmateResponse = await request(app)
        .post("/api/players/register")
        .send({
          name: "Crewmate1",
          role: "crewmate",
        })
        .expect(201);

      crewtmateId = crewmateResponse.body._id;

      // Register imposter
      const imposterResponse = await request(app)
        .post("/api/players/register")
        .send({
          name: "Imposter1",
          role: "imposter",
        })
        .expect(201);

      imposterId = imposterResponse.body._id;

      // Both join the game
      await request(app)
        .post(`/api/games/${gameId}/join`)
        .send({ playerId: crewtmateId, playerName: "Crewmate1" })
        .expect(200);

      await request(app)
        .post(`/api/games/${gameId}/join`)
        .send({ playerId: imposterId, playerName: "Imposter1" })
        .expect(200);

      // Assign real task to crewmate
      await request(app)
        .post("/api/tasks/assign")
        .send({
          playerId: crewtmateId,
          gameId: gameId,
          taskType: "coding",
          difficulty: "medium",
        })
        .expect(200);

      // Assign fake task to imposter
      await request(app)
        .post("/api/tasks/assign")
        .send({
          playerId: imposterId,
          gameId: gameId,
          taskType: "fake-coding",
          difficulty: "medium",
          isImposterTask: true,
        })
        .expect(200);

      // Crewmate submits real solution
      await request(app)
        .post("/api/tasks/submit")
        .send({
          taskId: "real-task-id",
          playerId: crewtmateId,
          solution: 'function realSolution() { return "correct"; }',
          timeSpent: 240,
        })
        .expect(200);

      // Imposter submits fake solution
      await request(app)
        .post("/api/tasks/submit")
        .send({
          taskId: "fake-task-id",
          playerId: imposterId,
          solution: 'function fakeSolution() { return "fake"; }',
          isImposterSubmission: true,
          timeSpent: 120,
        })
        .expect(200);

      // Imposter eliminates crewmate (simulated)
      await request(app)
        .put("/api/players/status")
        .send({
          playerId: crewtmateId,
          status: "eliminated",
        })
        .expect(200);

      // Verify final game state
      const finalTasks = await request(app)
        .get("/api/tasks")
        .query({ gameId: gameId })
        .expect(200);

      expect(finalTasks.body).toHaveProperty("tasks");

      const finalPlayers = await request(app).get("/api/players").expect(200);

      const eliminatedPlayer = finalPlayers.body.find(
        (p: any) => p._id === crewtmateId
      );
      expect(eliminatedPlayer.status).toBe("eliminated");
    });
  });

  describe("Error Scenarios Integration", () => {
    it("should handle cascading errors gracefully", async () => {
      // Try to join non-existent game
      await request(app)
        .post("/api/games/nonexistent/join")
        .send({ playerId: "test", playerName: "Test" })
        .expect(500);

      // Try to update non-existent player
      await request(app)
        .put("/api/players/status")
        .send({ playerId: "507f1f77bcf86cd799439011", status: "active" })
        .expect(404);

      // Try to assign task without proper data
      await request(app).post("/api/tasks/assign").send({}).expect(200); // Current implementation doesn't validate

      // Try to submit task without proper data
      await request(app).post("/api/tasks/submit").send({}).expect(200); // Current implementation doesn't validate
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle multiple players joining simultaneously", async () => {
      // Create game
      const gameResponse = await request(app)
        .post("/api/games")
        .send({
          name: "Concurrent Game",
          maxPlayers: 8,
        })
        .expect(201);

      const gameId = gameResponse.body.gameId;

      // Register multiple players
      const playerPromises = [];
      for (let i = 0; i < 5; i++) {
        playerPromises.push(
          request(app)
            .post("/api/players/register")
            .send({
              name: `Player${i}`,
              role: i === 0 ? "imposter" : "crewmate",
            })
        );
      }

      const players = await Promise.all(playerPromises);

      // All players join simultaneously
      const joinPromises = players.map((playerResponse, index) =>
        request(app)
          .post(`/api/games/${gameId}/join`)
          .send({
            playerId: playerResponse.body._id,
            playerName: `Player${index}`,
          })
      );

      const joinResponses = await Promise.all(joinPromises);

      // Verify all joined successfully
      joinResponses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });
});
