import { Request, Response } from "express";
import Game from "../models/Game";
import Player from "../models/Player";
import { TaskModel, ITask } from "../models/Task";
import SocketService, {
  getIO,
  sanitizeGameForPlayer,
} from "../services/socketService";

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

  public joinGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const { playerId } = req.body;
      console.log("Joining game:", gameId, "with player:", playerId);

      // Optimize query by selecting only necessary fields
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
      // Emit sanitized game data to each player
      for (const player of game.players) {
        io.to(player.playerId).emit(
          "gameStarted",
          sanitizeGameForPlayer(game, player.playerId)
        );
      }

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

        // Add task ID to player's tasks (only once)
        player.tasks.push(taskId);

        // Update in the game players array
        const gamePlayer = game.players.find(
          (p: any) => p.playerId === player.playerId
        );
        if (gamePlayer) {
          // Only add if not already present to avoid duplicates
          if (!gamePlayer.tasks.includes(taskId)) {
            gamePlayer.tasks.push(taskId);
          }
        }
      }
    }

    // Save tasks to database
    for (const task of tasks) {
      const taskModel = new TaskModel(task);
      await taskModel.save();
    }

    game.tasks = tasks;
    // Save the game with updated tasks and player task assignments
    await game.save();
  }

  public getGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const { playerId } = req.query; // Get the requesting player's ID
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

      // Create a sanitized version of the game data
      const gameObj = game.toObject();
      const sanitizedGame = {
        ...gameObj,
        players: gameObj.players.map((player: any) => {
          // For the requesting player, send their own role
          if (playerId && player.playerId === playerId) {
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

      // Find the task
      const task = game.tasks.find((t: any) => t.taskId === taskId) as
        | ITask
        | undefined;
      if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
      }

      // Check if task is already completed
      if (task.status === "completed") {
        res.status(400).json({ message: "Task already completed" });
        return;
      }

      // Verify the answer
      const isCorrect = task.answer.toLowerCase() === answer.toLowerCase();

      // Update task status
      task.status = isCorrect ? "completed" : "failed";
      if (isCorrect) {
        task.completedAt = new Date();
      }

      // Update player's completed tasks if correct
      if (isCorrect) {
        const player = game.players.find((p) => p.playerId === playerId);
        if (player) {
          player.completedTasks.push(taskId);

          // Update in database
          await Player.findOneAndUpdate(
            { playerId },
            { $push: { completedTasks: taskId } }
          );
        }
      }

      await game.save();

      // Notify all players about task submission
      const io = getIO();
      io.to(gameId).emit("taskSubmitted", {
        taskId,
        playerId,
        isCorrect,
        task,
      });

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

      await game.save();

      // Notify all players about the sabotage
      const io = getIO();
      io.to(gameId).emit("sabotage", {
        sabotageType,
        playerId,
      });

      res.status(200).json({ message: "Sabotage initiated successfully" });
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
}

export default GameController;
