import { Request, Response } from "express";
import Game from "../models/Game";
import Player from "../models/Player";
import { TaskModel, ITask } from "../models/Task";
import SocketService, { getIO } from "../services/socketService";

// Sample technical questions database
const TECHNICAL_QUESTIONS = [
  {
    question: "What is the time complexity of binary search?",
    options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
    answer: "O(log n)",
    category: "Algorithms",
    difficulty: "medium",
  },
  {
    question: "Which of the following is not a JavaScript framework?",
    options: ["React", "Angular", "Django", "Vue"],
    answer: "Django",
    category: "Web Development",
    difficulty: "easy",
  },
  {
    question: "What does SQL stand for?",
    options: [
      "Structured Query Language",
      "Standard Query Language",
      "Simple Query Language",
      "Sequential Query Language",
    ],
    answer: "Structured Query Language",
    category: "Databases",
    difficulty: "easy",
  },
  {
    question: "Which data structure uses LIFO principle?",
    options: ["Queue", "Stack", "Tree", "Graph"],
    answer: "Stack",
    category: "Data Structures",
    difficulty: "easy",
  },
  {
    question: "What is the output of 2 ** 3 in Python?",
    options: ["6", "8", "9", "None of the above"],
    answer: "8",
    category: "Python",
    difficulty: "easy",
  },
];

// Sabotage tasks database
const SABOTAGE_TASKS = [
  {
    description: "Fix Reactor Meltdown",
    question: "What is the correct way to handle state updates in React?",
    options: [
      "Directly mutate state",
      "Use setState or useState hook",
      "Use props to update state",
      "Use refs for all state changes",
    ],
    answer: "Use setState or useState hook",
    category: "React",
    difficulty: "medium",
    sabotageType: "reactor",
  },
  {
    description: "Restore Oxygen Supply",
    question: "Which HTTP status code indicates 'OK'?",
    options: ["200", "404", "500", "301"],
    answer: "200",
    category: "HTTP",
    difficulty: "easy",
    sabotageType: "oxygen",
  },
  {
    description: "Fix Lights",
    question: "What is the purpose of CSS flexbox?",
    options: [
      "To create grid layouts",
      "To handle responsive images",
      "To create flexible layouts",
      "To style text elements",
    ],
    answer: "To create flexible layouts",
    category: "CSS",
    difficulty: "medium",
    sabotageType: "lights",
  },
  {
    description: "Repair Communications",
    question:
      "Which method is used to add an element to the end of an array in JavaScript?",
    options: ["push()", "pop()", "shift()", "unshift()"],
    answer: "push()",
    category: "JavaScript",
    difficulty: "easy",
    sabotageType: "communications",
  },
];
// Function to sanitize game data for a specific player
// Hides roles of other players to prevent cheating
const sanitizeGameForPlayer = (game: any, playerId: string) => {
  // Create a copy of the game object
  const sanitizedGame = JSON.parse(JSON.stringify(game));

  // Hide roles of other players
  sanitizedGame.players = sanitizedGame.players.map((player: any) => {
    // If this is the current player, show their role
    if (player.playerId === playerId) {
      return player;
    }

    // For other players, hide their role but keep other information
    return {
      ...player,
      role: "hidden", // Hide the actual role
    };
  });

  return sanitizedGame;
};

class GameController {
  public createGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const { imposterCount = 1 } = req.body;

      // Validate imposter count
      if (imposterCount < 1 || imposterCount > 3) {
        res
          .status(400)
          .json({ message: "Imposter count must be between 1 and 3" });
        return;
      }

      // Generate unique game ID
      const gameId = `game_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const newGame = new Game({
        gameId,
        players: [],
        tasks: [],
        gameStatus: "waiting",
        imposterCount,
        currentSabotage: null,
        votes: new Map<string, string>(),
        voteHistory: [],
        deadPlayers: [],
        meetingCalledBy: null,
        createdAt: new Date(),
        startedAt: null,
        endedAt: null,
        winner: null,
      });

      await newGame.save();

      res.status(201).json(newGame);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  public getAllGames = async (req: Request, res: Response): Promise<void> => {
    try {
      // Fetch all games with minimal data for the admin dashboard
      const games = await Game.find(
        {},
        {
          gameId: 1,
          gameStatus: 1,
          players: 1,
          createdAt: 1,
          startedAt: 1,
          endedAt: 1,
          winner: 1,
          __v: 0,
        }
      ).sort({ createdAt: -1 });

      res.status(200).json(games);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  public joinGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const { playerId } = req.body;
      console.log("Joining game:", gameId, "with player:", playerId);

      // Find the game
      const game = await Game.findOne({ gameId }).select({
        gameStatus: 1,
        players: 1,
      });

      if (!game) {
        console.log("Game not found:", gameId);
        res.status(404).json({ message: "Game not found" });
        return;
      }

      // Check if game is in waiting state
      if (game.gameStatus !== "waiting") {
        console.log("Game is not in waiting state:", game.gameStatus);
        res
          .status(400)
          .json({ message: "Cannot join game that has already started" });
        return;
      }

      // Find the player with only necessary fields
      const player = await Player.findOne({ playerId }).select({
        playerId: 1,
        name: 1,
        role: 1,
        status: 1,
        isOnline: 1,
        tasks: 1,
        completedTasks: 1,
        votes: 1,
        hasVoted: 1,
        currentRoom: 1,
        lastKillTime: 1,
        isVenting: 1,
      });

      if (!player) {
        console.log("Player not found:", playerId);
        res.status(404).json({ message: "Player not found" });
        return;
      }

      // Check if player is already in the game
      const playerExists = game.players.some((p) => p.playerId === playerId);
      if (playerExists) {
        console.log("Player already in game:", playerId);
        res.status(400).json({ message: "Player already in game" });
        return;
      }

      // Add player to game
      console.log("Adding player to game");
      game.players.push({
        playerId: player.playerId,
        name: player.name,
        role: player.role,
        status: player.status,
        isOnline: player.isOnline,
        tasks: player.tasks,
        completedTasks: player.completedTasks,
        votes: player.votes,
        hasVoted: player.hasVoted,
        currentRoom: player.currentRoom,
        lastKillTime: player.lastKillTime,
        isVenting: player.isVenting,
      });

      await game.save();
      console.log("Player added to game successfully");

      // Notify all players in the game about the new player
      const io = getIO();
      io.to(gameId).emit("playerJoined", {
        playerId: player.playerId,
        name: player.name,
      });

      res.status(200).json(game);
    } catch (error) {
      console.error("Error joining game:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  public startGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;

      // Find the game
      const game = await Game.findOne({ gameId });
      if (!game) {
        res.status(404).json({ message: "Game not found" });
        return;
      }

      // Check if there are enough players
      if (game.players.length < 2) {
        res
          .status(400)
          .json({ message: "Need at least 2 players to start the game" });
        return;
      }

      // Assign roles
      this.assignRoles(game);

      // Create tasks for players
      await this.createTasksForPlayers(game);

      // Update game status
      game.gameStatus = "in-progress";
      game.startedAt = new Date();

      await game.save();

      // Notify all players that the game has started
      const io = getIO();
      io.to(gameId).emit("gameStarted", {
        players: game.players,
        tasks: game.tasks,
        map: game.map,
      });

      res.status(200).json({ message: "Game started successfully", game });
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  private assignRoles(game: any): void {
    // Shuffle players
    const shuffledPlayers = [...game.players].sort(() => Math.random() - 0.5);

    // Assign impostors
    for (let i = 0; i < game.imposterCount && i < shuffledPlayers.length; i++) {
      const player = shuffledPlayers[i];
      player.role = "imposter";
      player.isImpostor = true;

      // Update in the game players array
      const gamePlayer = game.players.find(
        (p: any) => p.playerId === player.playerId
      );
      if (gamePlayer) {
        gamePlayer.role = "imposter";
        gamePlayer.isImpostor = true;
      }
    }

    // Assign crewmates to remaining players
    for (let i = game.imposterCount; i < shuffledPlayers.length; i++) {
      const player = shuffledPlayers[i];
      player.role = "crewmate";
      player.isImpostor = false;

      // Update in the game players array
      const gamePlayer = game.players.find(
        (p: any) => p.playerId === player.playerId
      );
      if (gamePlayer) {
        gamePlayer.role = "crewmate";
        gamePlayer.isImpostor = false;
      }
    }
  }

  private async createTasksForPlayers(game: any): Promise<void> {
    const tasks = [];

    // Define which rooms can have tasks (excluding sensitive areas like reactor, o2, etc. for regular tasks)
    const taskableRooms = [
      "cafeteria",
      "weapons",
      "admin",
      "storage",
      "electrical",
      "medbay",
      "communications",
      "shields",
      "navigation",
    ];

    // Assign tasks to crewmates only
    const crewmates = game.players.filter(
      (player: any) => player.role === "crewmate"
    );

    for (const player of crewmates) {
      // Assign 3 random tasks to each crewmate
      for (let i = 0; i < 3; i++) {
        const randomQuestion =
          TECHNICAL_QUESTIONS[
            Math.floor(Math.random() * TECHNICAL_QUESTIONS.length)
          ];

        const taskId = `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // Assign task to a random room
        const randomRoom =
          taskableRooms[Math.floor(Math.random() * taskableRooms.length)];

        const task = {
          taskId,
          description: `Technical Question ${i + 1}`,
          assignedTo: player.playerId,
          status: "pending",
          question: randomQuestion.question,
          answer: randomQuestion.answer,
          options: randomQuestion.options,
          category: randomQuestion.category,
          difficulty: randomQuestion.difficulty,
        };

        tasks.push(task);

        // Add task ID to player's tasks
        player.tasks.push(taskId);

        // Add task ID to the room's tasks
        const room = game.map.find((r: any) => r.name === randomRoom);
        if (room) {
          room.tasks.push(taskId);
        }

        // Update in the game players array
        const gamePlayer = game.players.find(
          (p: any) => p.playerId === player.playerId
        );
        if (gamePlayer) {
          gamePlayer.tasks.push(taskId);
        }
      }
    }

    // Assign normal tasks to impostors (but they can't complete them)
    const impostors = game.players.filter(
      (player: any) => player.role === "imposter"
    );

    for (const player of impostors) {
      // Assign 3 normal tasks to each impostor
      for (let i = 0; i < 3; i++) {
        const randomQuestion =
          TECHNICAL_QUESTIONS[
            Math.floor(Math.random() * TECHNICAL_QUESTIONS.length)
          ];

        const taskId = `task_${Date.now()}_${Math.floor(
          Math.random() * 1000
        )}_imposter`;

        // Assign task to a random room
        const randomRoom =
          taskableRooms[Math.floor(Math.random() * taskableRooms.length)];

        const task = {
          taskId,
          description: `Technical Question ${i + 1}`,
          assignedTo: player.playerId,
          status: "pending",
          question: randomQuestion.question,
          answer: randomQuestion.answer,
          options: randomQuestion.options,
          category: randomQuestion.category,
          difficulty: randomQuestion.difficulty,
        };

        tasks.push(task);

        // Add task ID to player's tasks
        player.tasks.push(taskId);

        // Update in the game players array
        const gamePlayer = game.players.find(
          (p: any) => p.playerId === player.playerId
        );
        if (gamePlayer) {
          gamePlayer.tasks.push(taskId);
        }
      }
    }

    // Save tasks to database
    for (const task of tasks) {
      const taskModel = new TaskModel(task);
      await taskModel.save();
    }

    game.tasks = tasks;
  }

  public getGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const playerId = (req as any).user?.playerId; // Get player ID from auth token
      console.log("Fetching game data for gameId:", gameId);

      // Optimize query by selecting only necessary fields
      const game = await Game.findOne({ gameId }).select({
        __v: 0,
        "tasks.__v": 0,
        "players.__v": 0,
      });

      if (!game) {
        console.log("Game not found:", gameId);
        res.status(404).json({ message: "Game not found" });
        return;
      }

      // Sanitize game data to hide other players' roles
      const sanitizedGame = playerId
        ? sanitizeGameForPlayer(game, playerId)
        : game;

      console.log("Game data fetched successfully");
      res.status(200).json(sanitizedGame);
    } catch (error) {
      console.error("Error fetching game data:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  public submitTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const { taskId, playerId, answer } = req.body;

      // Find the game
      const game = await Game.findOne({ gameId });
      if (!game) {
        res.status(404).json({ message: "Game not found" });
        return;
      }

      // Find the task in the game object
      const taskIndex = game.tasks.findIndex((t: any) => t.taskId === taskId);
      if (taskIndex === -1) {
        res.status(404).json({ message: "Task not found" });
        return;
      }

      const task = game.tasks[taskIndex];

      // Check if task is already completed
      if (task.status === "completed") {
        res.status(400).json({ message: "Task already completed" });
        return;
      }

      // Find the player who submitted the task
      const submittingPlayer = game.players.find(
        (p: any) => p.playerId === playerId
      );
      if (!submittingPlayer) {
        res.status(404).json({ message: "Player not found" });
        return;
      }

      // For crewmates, allow retrying failed tasks
      if (task.status === "failed" && submittingPlayer.role === "crewmate") {
        // Reset the task status to pending to allow retry
        task.status = "pending";
      }

      // Prevent impostors from submitting any tasks
      if (submittingPlayer.role === "imposter") {
        res.status(403).json({ message: "Impostors cannot submit tasks" });
        return;
      }

      // Verify the answer
      const isCorrect = task.answer.toLowerCase() === answer.toLowerCase();

      // Update task status in the game object
      if (isCorrect) {
        task.status = "completed";
        task.completedAt = new Date();
      } else {
        // For crewmates, keep task as pending to allow retries
        if (submittingPlayer.role === "crewmate") {
          task.status = "pending"; // Allow retry
        } else {
          task.status = "failed"; // Mark as failed for impostors
        }
      }

      // Update the task in the database
      await TaskModel.findOneAndUpdate(
        { taskId: task.taskId },
        {
          status: task.status,
          completedAt: task.completedAt,
        }
      );

      // Handle emergency task completion
      if (task.isEmergency && isCorrect) {
        // Clear the sabotage and emergency task
        game.currentSabotage = null;
        game.emergencyTaskId = null;
        game.sabotageDeadline = null;

        // Check win conditions - if all real tasks are completed, crewmates win
        const realTasks = game.tasks.filter(
          (t: any) => !t.isEmergency && t.assignedTo !== "all" // Exclude emergency tasks and sabotage tasks
        );
        const completedRealTasks = realTasks.filter(
          (t: any) => t.status === "completed"
        ).length;

        if (realTasks.length > 0 && completedRealTasks === realTasks.length) {
          // All tasks completed - crewmates win
          game.gameStatus = "ended";
          game.winner = "crewmates";
          game.endedAt = new Date();
        }
      }

      // Update player's completed tasks if correct (only for non-emergency tasks)
      if (isCorrect && !task.isEmergency) {
        // Only crewmates can complete tasks
        if (submittingPlayer.role === "crewmate") {
          submittingPlayer.completedTasks.push(taskId);

          // Update in database
          await Player.findOneAndUpdate(
            { playerId },
            { $push: { completedTasks: taskId } }
          );
        }
      }

      // Save the game before checking win conditions
      await game.save();

      // Notify all players about task submission
      const io = getIO();

      // For emergency tasks, notify all players
      if (task.isEmergency) {
        io.to(gameId).emit("taskSubmitted", {
          taskId,
          playerId,
          isCorrect,
          task,
        });
      } else {
        // For regular tasks, only notify the player who submitted and check win conditions
        // Send to the specific player
        io.to(gameId).emit("taskSubmitted", {
          taskId,
          playerId,
          isCorrect,
          task,
        });

        // If this was a crewmate completing a task, check win conditions
        if (submittingPlayer.role === "crewmate" && isCorrect) {
          // Reload the game to get the updated task status
          const updatedGame = await Game.findOne({ gameId });
          if (updatedGame) {
            // Get all real tasks (not emergency tasks)
            const realTasks = updatedGame.tasks.filter(
              (t: any) => !t.isEmergency && t.assignedTo !== "all"
            );

            // Get all completed real tasks
            const completedRealTasks = realTasks.filter(
              (t: any) => t.status === "completed"
            ).length;

            // Crewmates win if all their real tasks are completed
            if (
              realTasks.length > 0 &&
              completedRealTasks === realTasks.length
            ) {
              updatedGame.gameStatus = "ended";
              updatedGame.winner = "crewmates";
              updatedGame.endedAt = new Date();
              await updatedGame.save();

              // Notify all players that the game has ended
              io.to(gameId).emit("gameEnded", {
                winner: "crewmates",
                reason: "All tasks completed",
              });
            }
          }
        }
      }

      // If this was an emergency task and it was completed correctly, notify all players
      if (task.isEmergency && isCorrect) {
        io.to(gameId).emit("sabotageCleared", {
          message: "Sabotage has been cleared!",
          taskId,
        });

        // If the game ended due to all tasks completed, notify players
        if (game.gameStatus === "ended" && game.winner === "crewmates") {
          io.to(gameId).emit("gameEnded", {
            winner: "crewmates",
            reason: "All tasks completed",
          });
        }
      }

      res.status(200).json({
        message: isCorrect ? "Task completed successfully" : "Incorrect answer",
        isCorrect,
        task,
      });
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  public callMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const { playerId, reason } = req.body; // reason could be "deadBody", "emergency", etc.

      // Find the game
      const game = await Game.findOne({ gameId });
      if (!game) {
        res.status(404).json({ message: "Game not found" });
        return;
      }

      // Update game status to discussion
      game.gameStatus = "discussion";
      game.meetingCalledBy = playerId;

      await game.save();

      // Reset voting for all players
      for (const player of game.players) {
        player.hasVoted = false;
        player.votes = [];
      }

      // Clear current votes
      game.votes = new Map<string, string>();

      await game.save();

      // Notify all players about the meeting
      const io = getIO();
      io.to(gameId).emit("meetingCalled", {
        calledBy: playerId,
        reason,
        players: game.players,
      });

      res.status(200).json({ message: "Meeting called successfully" });
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  public vote = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const { voterId, votedPlayerId } = req.body;

      // Find the game
      const game = await Game.findOne({ gameId });
      if (!game) {
        res.status(404).json({ message: "Game not found" });
        return;
      }

      // Check if game is in voting state
      if (game.gameStatus !== "discussion") {
        res.status(400).json({ message: "Voting is not active" });
        return;
      }

      // Find the voter
      const voter = game.players.find((p) => p.playerId === voterId);
      if (!voter) {
        res.status(404).json({ message: "Voter not found" });
        return;
      }

      // Check if voter is alive
      if (voter.status !== "alive") {
        res.status(400).json({ message: "Dead players cannot vote" });
        return;
      }

      // Check if voter has already voted
      if (voter.hasVoted) {
        res.status(400).json({ message: "Player has already voted" });
        return;
      }

      // Find the voted player (can vote for skip/eject)
      if (votedPlayerId !== "skip") {
        const votedPlayer = game.players.find(
          (p) => p.playerId === votedPlayerId
        );
        if (!votedPlayer) {
          res.status(404).json({ message: "Voted player not found" });
          return;
        }
      }

      // Record the vote
      voter.hasVoted = true;
      voter.votes.push(votedPlayerId);
      game.votes.set(voterId, votedPlayerId);

      await game.save();

      // Check if all players have voted
      const alivePlayers = game.players.filter((p) => p.status === "alive");
      const allVoted = alivePlayers.every((p) => p.hasVoted);

      // Notify all players about the vote
      const io = getIO();
      io.to(gameId).emit("voteRecorded", {
        voterId,
        votedPlayerId,
        allVoted,
      });

      // If all players have voted, tally the votes
      if (allVoted) {
        await this.tallyVotes(gameId);
      }

      res.status(200).json({ message: "Vote recorded successfully" });
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  private async tallyVotes(gameId: string): Promise<void> {
    // Find the game
    const game = await Game.findOne({ gameId });
    if (!game) {
      return;
    }

    // Count votes
    const voteCounts: Map<string, number> = new Map();
    voteCounts.set("skip", 0); // For skip votes

    // Initialize vote counts for all players
    for (const player of game.players) {
      voteCounts.set(player.playerId, 0);
    }

    // Count votes
    for (const [voterId, votedPlayerId] of game.votes.entries()) {
      if (voteCounts.has(votedPlayerId)) {
        voteCounts.set(votedPlayerId, voteCounts.get(votedPlayerId)! + 1);
      }
    }

    // Find the player with the most votes
    let ejectedPlayerId: string | null = null;
    let maxVotes = 0;
    let tie = false;

    for (const [playerId, votes] of voteCounts.entries()) {
      if (playerId !== "skip" && votes > maxVotes) {
        maxVotes = votes;
        ejectedPlayerId = playerId;
        tie = false;
      } else if (playerId !== "skip" && votes === maxVotes && votes > 0) {
        tie = true;
      }
    }

    // If there's a tie or skip wins, no one gets ejected
    if (
      tie ||
      ejectedPlayerId === null ||
      (voteCounts.get("skip") || 0) >= maxVotes
    ) {
      ejectedPlayerId = null;
    }

    // Eject the player if applicable
    if (ejectedPlayerId) {
      const player = game.players.find((p) => p.playerId === ejectedPlayerId);
      if (player) {
        player.status = "dead";
        game.deadPlayers.push(ejectedPlayerId);

        // Update in database
        await Player.findOneAndUpdate(
          { playerId: ejectedPlayerId },
          { status: "dead" }
        );
      }
    }

    // Add to vote history
    game.voteHistory.push({
      round: game.voteHistory.length + 1,
      votes: new Map(game.votes),
    });

    // Reset voting
    for (const player of game.players) {
      player.hasVoted = false;
      player.votes = [];
    }
    game.votes = new Map<string, string>();
    game.meetingCalledBy = null;

    // Check win conditions
    const winResult = this.checkWinConditions(game);
    if (winResult.gameOver) {
      game.gameStatus = "ended";
      game.winner = winResult.winner;
      game.endedAt = new Date();
    } else {
      // Return to gameplay
      game.gameStatus = "in-progress";
    }

    await game.save();

    // Notify all players about the vote result
    const io = getIO();
    io.to(gameId).emit("voteResult", {
      ejectedPlayerId,
      voteCounts: Object.fromEntries(voteCounts),
      gameOver: winResult.gameOver,
      winner: winResult.winner,
    });
  }

  private checkWinConditions(game: any): {
    gameOver: boolean;
    winner: "crewmates" | "impostors" | null;
  } {
    // Get all real tasks (tasks assigned to crewmates only)
    const realTasks = game.tasks.filter(
      (t: any) =>
        !t.isEmergency &&
        t.assignedTo !== "all" &&
        game.players.some(
          (p: any) => p.playerId === t.assignedTo && p.role === "crewmate"
        )
    );

    // Get all completed real tasks
    const completedRealTasks = realTasks.filter(
      (t: any) => t.status === "completed"
    ).length;

    // Crewmates win if all their real tasks are completed
    if (realTasks.length > 0 && completedRealTasks === realTasks.length) {
      return { gameOver: true, winner: "crewmates" };
    }

    // Count alive impostors
    const aliveImpostors = game.players.filter(
      (p: any) => p.role === "imposter" && p.status === "alive"
    ).length;

    // Count alive crewmates
    const aliveCrewmates = game.players.filter(
      (p: any) => p.role === "crewmate" && p.status === "alive"
    ).length;

    // Impostors win if they equal or outnumber crewmates
    if (aliveImpostors >= aliveCrewmates && aliveCrewmates > 0) {
      return { gameOver: true, winner: "impostors" };
    }

    // Crewmates win if all impostors are dead
    if (aliveImpostors === 0) {
      return { gameOver: true, winner: "crewmates" };
    }

    // Game continues
    return { gameOver: false, winner: null };
  }

  public sabotage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const { playerId, sabotageType } = req.body;

      // Find the game
      const game = await Game.findOne({ gameId });
      if (!game) {
        res.status(404).json({ message: "Game not found" });
        return;
      }

      // Find the player
      const player = game.players.find((p) => p.playerId === playerId);
      if (!player) {
        res.status(404).json({ message: "Player not found" });
        return;
      }

      // Check if player is an imposter
      if (player.role !== "imposter") {
        res.status(403).json({ message: "Only impostors can sabotage" });
        return;
      }

      // Set the sabotage
      game.currentSabotage = sabotageType;

      // Create emergency task for all players
      const emergencyTaskId = `emergency_${Date.now()}_${Math.floor(
        Math.random() * 1000
      )}`;
      const deadline = new Date(Date.now() + 30000); // 30 seconds from now

      // Find the appropriate sabotage task
      const sabotageTask = SABOTAGE_TASKS.find(
        (task) => task.sabotageType === sabotageType
      ) || {
        description: `Emergency: Fix ${sabotageType} sabotage`,
        question: `Emergency! Fix the ${sabotageType} sabotage immediately:`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        answer: "Option A",
        category: "Emergency",
        difficulty: "medium",
      };

      // Create the emergency task object that matches the ITask interface
      const emergencyTaskData = {
        taskId: emergencyTaskId,
        description: sabotageTask.description,
        assignedTo: "all", // Assigned to all players
        status: "pending" as const,
        question: sabotageTask.question,
        answer: sabotageTask.answer,
        options: sabotageTask.options,
        category: sabotageTask.category,
        difficulty: sabotageTask.difficulty as "easy" | "medium" | "hard",
        isEmergency: true,
        deadline: deadline,
        createdAt: new Date(),
      };

      // Add emergency task to game
      game.tasks.push(emergencyTaskData);
      game.emergencyTaskId = emergencyTaskId;
      game.sabotageDeadline = deadline;

      await game.save();

      // Notify all players about the sabotage and emergency task
      const io = getIO();
      io.to(gameId).emit("sabotage", {
        sabotageType,
        playerId,
        emergencyTask: emergencyTaskData,
        deadline: deadline.toISOString(),
      });

      // Start a timer to check if the emergency task is completed in time
      setTimeout(async () => {
        // Check if the game still exists and the emergency task is still pending
        const updatedGame = await Game.findOne({ gameId });
        if (
          updatedGame &&
          updatedGame.emergencyTaskId === emergencyTaskId &&
          updatedGame.gameStatus !== "ended"
        ) {
          // Check if the emergency task is still pending
          const task = updatedGame.tasks.find(
            (t) => t.taskId === emergencyTaskId
          );
          if (task && task.status === "pending") {
            // Emergency task was not completed in time - impostors win
            updatedGame.gameStatus = "ended";
            updatedGame.winner = "impostors";
            updatedGame.endedAt = new Date();
            updatedGame.currentSabotage = null;
            updatedGame.emergencyTaskId = null;
            updatedGame.sabotageDeadline = null;

            await updatedGame.save();

            // Notify all players that impostors win due to sabotage timeout
            io.to(gameId).emit("gameEnded", {
              winner: "impostors",
              reason: "Sabotage emergency task not completed in time",
            });
          }
        }
      }, 30000); // 30 seconds

      res.status(200).json({
        message: "Sabotage initiated successfully",
        emergencyTask: emergencyTaskData,
      });
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  public movePlayer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const { playerId, targetRoom } = req.body;

      // Find the game
      const game = await Game.findOne({ gameId });
      if (!game) {
        res.status(404).json({ message: "Game not found" });
        return;
      }

      // Find the player
      const player = game.players.find((p) => p.playerId === playerId);
      if (!player) {
        res.status(404).json({ message: "Player not found" });
        return;
      }

      // Check if player is alive
      if (player.status !== "alive") {
        res.status(400).json({ message: "Dead players cannot move" });
        return;
      }

      // Validate that target room exists
      const targetRoomObj = game.map.find(
        (room: any) => room.name === targetRoom
      );
      if (!targetRoomObj) {
        res.status(400).json({ message: "Target room does not exist" });
        return;
      }

      // Validate that target room is adjacent to current room
      const currentRoomObj = game.map.find(
        (room: any) => room.name === player.currentRoom
      );
      if (
        !currentRoomObj ||
        !currentRoomObj.adjacentRooms.includes(targetRoom)
      ) {
        res.status(400).json({ message: "Cannot move to non-adjacent room" });
        return;
      }

      // Update player's current room
      player.currentRoom = targetRoom;

      // Update in database
      await Player.findOneAndUpdate({ playerId }, { currentRoom: targetRoom });

      await game.save();

      // Notify all players about the move
      const io = getIO();
      io.to(gameId).emit("playerMoved", {
        playerId,
        playerName: player.name,
        roomName: targetRoom,
      });

      res.status(200).json({ message: "Player moved successfully" });
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  public useVent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const { playerId, targetRoom } = req.body;

      // Find the game
      const game = await Game.findOne({ gameId });
      if (!game) {
        res.status(404).json({ message: "Game not found" });
        return;
      }

      // Find the player
      const player = game.players.find((p) => p.playerId === playerId);
      if (!player) {
        res.status(404).json({ message: "Player not found" });
        return;
      }

      // Check if player is alive
      if (player.status !== "alive") {
        res.status(400).json({ message: "Dead players cannot use vents" });
        return;
      }

      // Check if player is an imposter
      if (player.role !== "imposter") {
        res.status(403).json({ message: "Only impostors can use vents" });
        return;
      }

      // Check if target room is a valid vent destination
      const currentRoom = game.map.find(
        (room: any) => room.name === player.currentRoom
      );
      if (!currentRoom || !currentRoom.ventsTo.includes(targetRoom)) {
        res.status(400).json({ message: "Invalid vent destination" });
        return;
      }

      // Check vent cooldown
      if (player.lastKillTime) {
        const timeSinceLastKill =
          (new Date().getTime() - player.lastKillTime.getTime()) / 1000;
        if (timeSinceLastKill < game.ventCooldown) {
          res.status(400).json({
            message: `Vent cooldown active. ${Math.ceil(
              game.ventCooldown - timeSinceLastKill
            )} seconds remaining.`,
          });
          return;
        }
      }

      // Update player's current room and venting status
      player.currentRoom = targetRoom;
      player.isVenting = true;

      // Update in database
      await Player.findOneAndUpdate(
        { playerId },
        { currentRoom: targetRoom, isVenting: true, lastKillTime: new Date() }
      );

      await game.save();

      // Notify all players about the vent move
      const io = getIO();
      io.to(gameId).emit("playerVentMove", {
        playerId,
        playerName: player.name,
        targetRoom,
      });

      // Reset venting status after a short delay
      setTimeout(async () => {
        await Player.updateOne({ playerId }, { isVenting: false });
      }, 2000);

      res.status(200).json({ message: "Vent move successful" });
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  public killPlayer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const { killerId, targetId } = req.body;

      // Find the game
      const game = await Game.findOne({ gameId });
      if (!game) {
        res.status(404).json({ message: "Game not found" });
        return;
      }

      // Find the killer
      const killer = game.players.find((p) => p.playerId === killerId);
      if (!killer) {
        res.status(404).json({ message: "Killer not found" });
        return;
      }

      // Check if killer is an imposter
      if (killer.role !== "imposter") {
        res.status(403).json({ message: "Only impostors can kill" });
        return;
      }

      // Check if killer is alive
      if (killer.status !== "alive") {
        res.status(400).json({ message: "Dead players cannot kill" });
        return;
      }

      // Find the target
      const target = game.players.find((p) => p.playerId === targetId);
      if (!target) {
        res.status(404).json({ message: "Target not found" });
        return;
      }

      // Check if target is alive
      if (target.status !== "alive") {
        res.status(400).json({ message: "Cannot kill a dead player" });
        return;
      }

      // Check if both players are in the same room
      if (killer.currentRoom !== target.currentRoom) {
        res
          .status(400)
          .json({ message: "Players must be in the same room to kill" });
        return;
      }

      // Check kill cooldown
      if (killer.lastKillTime) {
        const timeSinceLastKill =
          (new Date().getTime() - killer.lastKillTime.getTime()) / 1000;
        if (timeSinceLastKill < game.killCooldown) {
          res.status(400).json({
            message: `Kill cooldown active. ${Math.ceil(
              game.killCooldown - timeSinceLastKill
            )} seconds remaining.`,
          });
          return;
        }
      }

      // Update target player's status to dead
      target.status = "dead";
      game.deadPlayers.push(targetId);

      // Update killer's last kill time
      killer.lastKillTime = new Date();

      // Update in database
      await Player.findOneAndUpdate({ playerId: targetId }, { status: "dead" });

      await Player.findOneAndUpdate(
        { playerId: killerId },
        { lastKillTime: new Date() }
      );

      await game.save();

      // Notify all players about the kill
      const io = getIO();
      io.to(gameId).emit("playerKilled", {
        killerId,
        targetId,
        targetName: target.name,
        killerName: killer.name,
      });

      res.status(200).json({ message: "Player killed successfully" });
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  public reportBody = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const { reporterId, deadPlayerId } = req.body;

      // Find the game
      const game = await Game.findOne({ gameId });
      if (!game) {
        res.status(404).json({ message: "Game not found" });
        return;
      }

      // Find the reporter
      const reporter = game.players.find((p) => p.playerId === reporterId);
      if (!reporter) {
        res.status(404).json({ message: "Reporter not found" });
        return;
      }

      // Check if reporter is alive
      if (reporter.status !== "alive") {
        res.status(400).json({ message: "Dead players cannot report bodies" });
        return;
      }

      // Find the dead player
      const deadPlayer = game.players.find((p) => p.playerId === deadPlayerId);
      if (!deadPlayer) {
        res.status(404).json({ message: "Dead player not found" });
        return;
      }

      // Check if the player is actually dead
      if (deadPlayer.status !== "dead") {
        res.status(400).json({ message: "Player is not dead" });
        return;
      }

      // Check if both players are in the same room
      if (reporter.currentRoom !== deadPlayer.currentRoom) {
        res.status(400).json({
          message: "Players must be in the same room to report a body",
        });
        return;
      }

      // Notify all players about the body report
      const io = getIO();
      io.to(gameId).emit("bodyReported", {
        reporterId,
        reporterName: reporter.name,
        deadPlayerId,
        deadPlayerName: deadPlayer.name,
        roomName: deadPlayer.currentRoom,
      });

      res.status(200).json({ message: "Body reported successfully" });
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  public endGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;

      const game = await Game.findOne({ gameId });
      if (!game) {
        res.status(404).json({ message: "Game not found" });
        return;
      }

      game.gameStatus = "ended";
      game.endedAt = new Date();

      // For demonstration, let's say crewmates win
      game.winner = "crewmates";

      await game.save();

      // Notify all players that the game has ended
      const io = getIO();
      io.to(gameId).emit("gameEnded", {
        winner: game.winner,
      });

      res.status(200).json({ message: "Game ended successfully", game });
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  public kickPlayer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const { playerId } = req.body;

      const game = await Game.findOne({ gameId });
      if (!game) {
        res.status(404).json({ message: "Game not found" });
        return;
      }

      // Remove player from the game
      game.players = game.players.filter((p: any) => p.playerId !== playerId);

      // Also remove player from deadPlayers list if present
      game.deadPlayers = game.deadPlayers.filter(
        (id: string) => id !== playerId
      );

      // If the player was the one who called the meeting, reset that
      if (game.meetingCalledBy === playerId) {
        game.meetingCalledBy = null;
      }

      await game.save();

      // Notify all players that a player has been kicked
      const io = getIO();
      io.to(gameId).emit("playerKicked", {
        playerId,
        message: "Player has been kicked by admin",
      });

      res.status(200).json({ message: "Player kicked successfully", game });
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };
}

export default GameController;
