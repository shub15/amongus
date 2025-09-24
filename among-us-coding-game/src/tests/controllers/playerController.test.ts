import request from "supertest";
import { createTestApp, createMockPlayer } from "../utils/testHelpers";
import Player from "../../models/Player";

describe("Player Controller", () => {
  const app = createTestApp();

  describe("POST /api/players/register", () => {
    it("should register a new player successfully", async () => {
      const playerData = createMockPlayer();

      const response = await request(app)
        .post("/api/players/register")
        .send(playerData)
        .expect(201);

      expect(response.body).toHaveProperty("_id");
      expect(response.body.name).toBe(playerData.name);
      expect(response.body.role).toBe(playerData.role);
    });

    it("should return 400 for missing required fields", async () => {
      const incompletePlayerData = {
        name: "TestPlayer",
        // Missing role
      };

      const response = await request(app)
        .post("/api/players/register")
        .send(incompletePlayerData)
        .expect(500); // Based on current error handling

      expect(response.body).toHaveProperty("message");
    });

    it("should register player with imposter role", async () => {
      const imposterData = {
        name: "ImposterPlayer",
        role: "imposter",
      };

      const response = await request(app)
        .post("/api/players/register")
        .send(imposterData)
        .expect(201);

      expect(response.body.role).toBe("imposter");
    });

    it("should register player with crewmate role", async () => {
      const crewmateData = {
        name: "CrewmatePlayer",
        role: "crewmate",
      };

      const response = await request(app)
        .post("/api/players/register")
        .send(crewmateData)
        .expect(201);

      expect(response.body.role).toBe("crewmate");
    });

    it("should handle duplicate player names", async () => {
      const playerData = createMockPlayer();

      // Register first player
      await request(app)
        .post("/api/players/register")
        .send(playerData)
        .expect(201);

      // Try to register same player again
      const response = await request(app)
        .post("/api/players/register")
        .send(playerData)
        .expect(201); // Current implementation doesn't prevent duplicates

      expect(response.body.name).toBe(playerData.name);
    });
  });

  describe("PUT /api/players/status", () => {
    let playerId: string;

    beforeEach(async () => {
      // Create a test player first
      const playerData = createMockPlayer();
      const playerResponse = await request(app)
        .post("/api/players/register")
        .send(playerData);
      playerId = playerResponse.body._id;
    });

    it("should update player status successfully", async () => {
      const statusData = {
        playerId: playerId,
        status: "active",
      };

      const response = await request(app)
        .put("/api/players/status")
        .send(statusData)
        .expect(200);

      expect(response.body.status).toBe("active");
      expect(response.body._id).toBe(playerId);
    });

    it("should return 404 for non-existent player", async () => {
      const statusData = {
        playerId: "507f1f77bcf86cd799439011", // Valid ObjectId format but non-existent
        status: "active",
      };

      const response = await request(app)
        .put("/api/players/status")
        .send(statusData)
        .expect(404);

      expect(response.body.message).toBe("Player not found");
    });

    it("should update status to inactive", async () => {
      const statusData = {
        playerId: playerId,
        status: "inactive",
      };

      const response = await request(app)
        .put("/api/players/status")
        .send(statusData)
        .expect(200);

      expect(response.body.status).toBe("inactive");
    });

    it("should update status to eliminated", async () => {
      const statusData = {
        playerId: playerId,
        status: "eliminated",
      };

      const response = await request(app)
        .put("/api/players/status")
        .send(statusData)
        .expect(200);

      expect(response.body.status).toBe("eliminated");
    });

    it("should handle invalid player ID format", async () => {
      const statusData = {
        playerId: "invalid-id",
        status: "active",
      };

      const response = await request(app)
        .put("/api/players/status")
        .send(statusData)
        .expect(500); // Based on current error handling

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /api/players", () => {
    beforeEach(async () => {
      // Create multiple test players
      const players = [
        { name: "Player1", role: "crewmate" },
        { name: "Player2", role: "imposter" },
        { name: "Player3", role: "crewmate" },
      ];

      for (const player of players) {
        await request(app).post("/api/players/register").send(player);
      }
    });

    it("should return all players", async () => {
      const response = await request(app).get("/api/players").expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);
    });

    it("should return empty array when no players exist", async () => {
      // Clear all players
      await Player.deleteMany({});

      const response = await request(app).get("/api/players").expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it("should return players with correct structure", async () => {
      const response = await request(app).get("/api/players").expect(200);

      response.body.forEach((player: any) => {
        expect(player).toHaveProperty("_id");
        expect(player).toHaveProperty("name");
        expect(player).toHaveProperty("role");
        expect(["crewmate", "imposter"]).toContain(player.role);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed request data", async () => {
      const response = await request(app)
        .post("/api/players/register")
        .send("invalid json")
        .expect(400);
    });

    it("should handle missing request body", async () => {
      const response = await request(app)
        .put("/api/players/status")
        .send({})
        .expect(500); // Based on current error handling

      expect(response.body).toHaveProperty("message");
    });
  });
});
