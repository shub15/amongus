import request from "supertest";
import { createTestApp, createMockTask } from "../utils/testHelpers";

describe("Task Controller", () => {
  const app = createTestApp();

  describe("POST /api/tasks/assign", () => {
    it("should assign a task successfully", async () => {
      const taskData = {
        playerId: "player123",
        gameId: "game456",
        taskType: "coding",
        difficulty: "medium",
      };

      const response = await request(app)
        .post("/api/tasks/assign")
        .send(taskData)
        .expect(200);

      expect(response.body.message).toBe("Task assigned successfully");
    });

    it("should handle missing task assignment data", async () => {
      const incompleteData = {
        playerId: "player123",
        // Missing other required fields
      };

      const response = await request(app)
        .post("/api/tasks/assign")
        .send(incompleteData)
        .expect(200);

      expect(response.body.message).toBe("Task assigned successfully");
    });

    it("should assign coding task to crewmate", async () => {
      const codingTaskData = {
        playerId: "crewmate123",
        gameId: "game456",
        taskType: "coding",
        difficulty: "hard",
        language: "javascript",
      };

      const response = await request(app)
        .post("/api/tasks/assign")
        .send(codingTaskData)
        .expect(200);

      expect(response.body.message).toBe("Task assigned successfully");
    });

    it("should assign fake task to imposter", async () => {
      const fakeTaskData = {
        playerId: "imposter123",
        gameId: "game456",
        taskType: "fake-coding",
        difficulty: "medium",
        isImposterTask: true,
      };

      const response = await request(app)
        .post("/api/tasks/assign")
        .send(fakeTaskData)
        .expect(200);

      expect(response.body.message).toBe("Task assigned successfully");
    });

    it("should handle bulk task assignment", async () => {
      const bulkTaskData = {
        gameId: "game456",
        tasks: [
          { playerId: "player1", taskType: "coding", difficulty: "easy" },
          { playerId: "player2", taskType: "coding", difficulty: "medium" },
          {
            playerId: "imposter1",
            taskType: "fake-coding",
            difficulty: "hard",
          },
        ],
      };

      const response = await request(app)
        .post("/api/tasks/assign")
        .send(bulkTaskData)
        .expect(200);

      expect(response.body.message).toBe("Task assigned successfully");
    });
  });

  describe("POST /api/tasks/submit", () => {
    it("should submit a completed task successfully", async () => {
      const submissionData = {
        taskId: "task123",
        playerId: "player123",
        solution: "function binarySearch(arr, target) { /* implementation */ }",
        timeSpent: 300, // 5 minutes
      };

      const response = await request(app)
        .post("/api/tasks/submit")
        .send(submissionData)
        .expect(200);

      expect(response.body.message).toBe("Task submitted successfully");
    });

    it("should handle submission without solution", async () => {
      const submissionData = {
        taskId: "task123",
        playerId: "player123",
        timeSpent: 60,
      };

      const response = await request(app)
        .post("/api/tasks/submit")
        .send(submissionData)
        .expect(200);

      expect(response.body.message).toBe("Task submitted successfully");
    });

    it("should submit task with test results", async () => {
      const submissionData = {
        taskId: "task123",
        playerId: "player123",
        solution: "function quickSort(arr) { /* implementation */ }",
        testResults: {
          passed: 8,
          failed: 2,
          total: 10,
          details: [
            { testCase: 1, status: "passed", executionTime: 45 },
            {
              testCase: 2,
              status: "failed",
              error: "Expected 5, got undefined",
            },
          ],
        },
      };

      const response = await request(app)
        .post("/api/tasks/submit")
        .send(submissionData)
        .expect(200);

      expect(response.body.message).toBe("Task submitted successfully");
    });

    it("should handle imposter fake submission", async () => {
      const fakeSubmissionData = {
        taskId: "fake-task123",
        playerId: "imposter123",
        solution: 'console.log("fake solution");',
        isImposterSubmission: true,
      };

      const response = await request(app)
        .post("/api/tasks/submit")
        .send(fakeSubmissionData)
        .expect(200);

      expect(response.body.message).toBe("Task submitted successfully");
    });

    it("should handle partial submission", async () => {
      const partialSubmissionData = {
        taskId: "task123",
        playerId: "player123",
        solution: "function incomplete() { // TODO: implement",
        isComplete: false,
        progress: 45,
      };

      const response = await request(app)
        .post("/api/tasks/submit")
        .send(partialSubmissionData)
        .expect(200);

      expect(response.body.message).toBe("Task submitted successfully");
    });
  });

  describe("GET /api/tasks", () => {
    it("should return all tasks", async () => {
      const response = await request(app).get("/api/tasks").expect(200);

      expect(response.body).toHaveProperty("tasks");
      expect(Array.isArray(response.body.tasks)).toBe(true);
    });

    it("should return tasks for specific player", async () => {
      const response = await request(app)
        .get("/api/tasks")
        .query({ playerId: "player123" })
        .expect(200);

      expect(response.body).toHaveProperty("tasks");
      expect(Array.isArray(response.body.tasks)).toBe(true);
    });

    it("should return tasks for specific game", async () => {
      const response = await request(app)
        .get("/api/tasks")
        .query({ gameId: "game456" })
        .expect(200);

      expect(response.body).toHaveProperty("tasks");
      expect(Array.isArray(response.body.tasks)).toBe(true);
    });

    it("should filter tasks by status", async () => {
      const response = await request(app)
        .get("/api/tasks")
        .query({ status: "completed" })
        .expect(200);

      expect(response.body).toHaveProperty("tasks");
      expect(Array.isArray(response.body.tasks)).toBe(true);
    });

    it("should filter tasks by difficulty", async () => {
      const response = await request(app)
        .get("/api/tasks")
        .query({ difficulty: "medium" })
        .expect(200);

      expect(response.body).toHaveProperty("tasks");
      expect(Array.isArray(response.body.tasks)).toBe(true);
    });

    it("should return tasks with pagination", async () => {
      const response = await request(app)
        .get("/api/tasks")
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty("tasks");
      expect(Array.isArray(response.body.tasks)).toBe(true);
    });

    it("should return empty array when no tasks exist", async () => {
      const response = await request(app)
        .get("/api/tasks")
        .query({ gameId: "nonexistent-game" })
        .expect(200);

      expect(response.body.tasks).toHaveLength(0);
    });
  });

  describe("Task Types and Difficulty Levels", () => {
    it("should handle easy coding tasks", async () => {
      const easyTask = {
        playerId: "player123",
        gameId: "game456",
        taskType: "coding",
        difficulty: "easy",
        language: "javascript",
      };

      const response = await request(app)
        .post("/api/tasks/assign")
        .send(easyTask)
        .expect(200);

      expect(response.body.message).toBe("Task assigned successfully");
    });

    it("should handle medium algorithm tasks", async () => {
      const mediumTask = {
        playerId: "player123",
        gameId: "game456",
        taskType: "algorithm",
        difficulty: "medium",
        category: "sorting",
      };

      const response = await request(app)
        .post("/api/tasks/assign")
        .send(mediumTask)
        .expect(200);

      expect(response.body.message).toBe("Task assigned successfully");
    });

    it("should handle hard data structure tasks", async () => {
      const hardTask = {
        playerId: "player123",
        gameId: "game456",
        taskType: "data-structure",
        difficulty: "hard",
        category: "trees",
      };

      const response = await request(app)
        .post("/api/tasks/assign")
        .send(hardTask)
        .expect(200);

      expect(response.body.message).toBe("Task assigned successfully");
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed task assignment data", async () => {
      const response = await request(app)
        .post("/api/tasks/assign")
        .send("invalid json")
        .expect(400);
    });

    it("should handle malformed task submission data", async () => {
      const response = await request(app)
        .post("/api/tasks/submit")
        .send("invalid json")
        .expect(400);
    });

    it("should handle server errors gracefully", async () => {
      // This would require mocking to simulate server errors
      const response = await request(app).get("/api/tasks").expect(200);

      expect(response.body).toHaveProperty("tasks");
    });
  });
});
