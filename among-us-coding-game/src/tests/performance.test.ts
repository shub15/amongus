import request from "supertest";
import { createTestApp } from "./utils/testHelpers";

describe("Performance Tests", () => {
  const app = createTestApp();

  describe("Load Testing", () => {
    it("should handle concurrent game creation", async () => {
      const startTime = Date.now();
      const concurrentRequests = 10;

      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        request(app)
          .post("/api/games")
          .send({
            name: `Load Test Game ${i}`,
            maxPlayers: 8,
          })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("gameId");
      });

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds
      console.log(
        `${concurrentRequests} concurrent game creations took ${duration}ms`
      );
    });

    it("should handle concurrent player registration", async () => {
      const startTime = Date.now();
      const concurrentRequests = 20;

      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        request(app)
          .post("/api/players/register")
          .send({
            name: `LoadTestPlayer${i}`,
            role: i % 4 === 0 ? "imposter" : "crewmate",
          })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("_id");
      });

      expect(duration).toBeLessThan(3000); // 3 seconds
      console.log(
        `${concurrentRequests} concurrent player registrations took ${duration}ms`
      );
    });

    it("should handle high volume task assignments", async () => {
      const startTime = Date.now();
      const taskCount = 50;

      const promises = Array.from({ length: taskCount }, (_, i) =>
        request(app)
          .post("/api/tasks/assign")
          .send({
            playerId: `player${i}`,
            gameId: "load-test-game",
            taskType: "coding",
            difficulty: ["easy", "medium", "hard"][i % 3],
          })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      expect(duration).toBeLessThan(2000); // 2 seconds
      console.log(`${taskCount} task assignments took ${duration}ms`);
    });
  });

  describe("Response Time Tests", () => {
    it("should respond to health check quickly", async () => {
      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await request(app).get("/health").expect(200);
        const end = Date.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      console.log(
        `Health check - Avg: ${avgTime}ms, Min: ${minTime}ms, Max: ${maxTime}ms`
      );

      expect(avgTime).toBeLessThan(50); // Average should be under 50ms
      expect(maxTime).toBeLessThan(200); // Max should be under 200ms
    });

    it("should handle task retrieval efficiently", async () => {
      const iterations = 50;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await request(app).get("/api/tasks").expect(200);
        const end = Date.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;

      console.log(`Task retrieval - Average response time: ${avgTime}ms`);
      expect(avgTime).toBeLessThan(100); // Should respond quickly
    });
  });

  describe("Memory Usage Tests", () => {
    it("should not cause memory leaks with repeated operations", async () => {
      const initialMemory = process.memoryUsage();

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await request(app)
          .post("/api/games")
          .send({
            name: `Memory Test Game ${i}`,
            maxPlayers: 4,
          });

        await request(app).get("/api/tasks");

        await request(app).get("/health");
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(
        `Memory increase after 300 operations: ${
          memoryIncrease / 1024 / 1024
        }MB`
      );

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
    });
  });

  describe("Stress Tests", () => {
    it("should handle rapid sequential requests", async () => {
      const requestCount = 200;
      const results = [];

      for (let i = 0; i < requestCount; i++) {
        const start = Date.now();
        const response = await request(app).get("/health");
        const end = Date.now();

        results.push({
          status: response.status,
          time: end - start,
        });
      }

      const successfulRequests = results.filter((r) => r.status === 200).length;
      const avgResponseTime =
        results.reduce((sum, r) => sum + r.time, 0) / results.length;

      console.log(`${successfulRequests}/${requestCount} requests successful`);
      console.log(`Average response time: ${avgResponseTime}ms`);

      expect(successfulRequests).toBe(requestCount);
      expect(avgResponseTime).toBeLessThan(100);
    });

    it("should maintain performance under mixed load", async () => {
      const startTime = Date.now();

      // Mix of different operations
      const operations = [
        () => request(app).get("/health"),
        () => request(app).post("/api/games").send({ name: "Stress Game" }),
        () =>
          request(app)
            .post("/api/players/register")
            .send({ name: "StressPlayer", role: "crewmate" }),
        () => request(app).get("/api/tasks"),
        () =>
          request(app)
            .post("/api/tasks/assign")
            .send({ playerId: "stress-player", gameId: "stress-game" }),
      ];

      const promises = [];
      for (let i = 0; i < 50; i++) {
        const randomOperation =
          operations[Math.floor(Math.random() * operations.length)];
        promises.push(randomOperation());
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successfulResponses = responses.filter(
        (r) => r.status < 400
      ).length;

      console.log(
        `Mixed load test: ${successfulResponses}/50 requests successful in ${totalTime}ms`
      );

      expect(successfulResponses).toBeGreaterThan(45); // At least 90% success rate
      expect(totalTime).toBeLessThan(10000); // Complete within 10 seconds
    });
  });
});
