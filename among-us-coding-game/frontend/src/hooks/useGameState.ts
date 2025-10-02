import { useState, useEffect } from "react";
import { Game, Player, Task } from "../types";
import SocketService from "../services/socket";
import { gameAPI, taskAPI } from "../services/api";

export const useGameState = (gameId: string, playerId: string) => {
  const [game, setGame] = useState<Game | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch player tasks
  const fetchPlayerTasks = async () => {
    try {
      // Get tasks assigned to the current player from the game data
      if (game) {
        const playerTaskIds =
          game.players.find((p: Player) => p.playerId === playerId)?.tasks ||
          [];
        // Remove duplicates from task IDs
        const uniqueTaskIds = [...new Set(playerTaskIds)];
        // Filter tasks that belong to this player
        const playerTasks = game.tasks.filter((task: Task) =>
          uniqueTaskIds.includes(task.taskId)
        );
        setTasks(playerTasks);
      }
    } catch (err) {
      setError("Failed to process tasks");
      console.error(err);
    }
  };

  useEffect(() => {
    // Connect to socket
    SocketService.connect();

    // Join the game room
    SocketService.joinGame(gameId, playerId);

    // Fetch initial game data
    const fetchGameData = async () => {
      try {
        setLoading(true);
        const gameResponse = await gameAPI.getGame(gameId, playerId);
        setGame(gameResponse.data);

        // Process player tasks from game data
        const playerTaskIds =
          gameResponse.data.players.find((p: Player) => p.playerId === playerId)
            ?.tasks || [];
        // Remove duplicates from task IDs
        const uniqueTaskIds = [...new Set(playerTaskIds)];
        // Filter tasks that belong to this player
        const playerTasks = gameResponse.data.tasks.filter((task: Task) =>
          uniqueTaskIds.includes(task.taskId)
        );
        setTasks(playerTasks);
      } catch (err) {
        setError("Failed to fetch game data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();

    // Set up socket listeners
    SocketService.on("gameStarted", (data) => {
      setGame((prev: Game | null) => {
        const updatedGame = prev
          ? { ...prev, ...data, gameStatus: "in-progress" }
          : null;

        // Process player tasks from updated game data
        if (updatedGame) {
          const playerTaskIds =
            updatedGame.players.find((p: Player) => p.playerId === playerId)
              ?.tasks || [];
          // Remove duplicates from task IDs
          const uniqueTaskIds = [...new Set(playerTaskIds)];
          // Filter tasks that belong to this player
          const playerTasks = updatedGame.tasks.filter((task: Task) =>
            uniqueTaskIds.includes(task.taskId)
          );
          setTasks(playerTasks);
        }

        return updatedGame;
      });
    });

    SocketService.on("taskUpdate", (data) => {
      // Update task status
      setTasks((prev: Task[]) =>
        prev.map((task: Task) =>
          task.taskId === data.taskId
            ? { ...task, status: data.status || "completed" }
            : task
        )
      );
    });

    SocketService.on("sabotageAlert", (data) => {
      setGame((prev: Game | null) =>
        prev ? { ...prev, currentSabotage: data.sabotageType } : null
      );
    });

    SocketService.on("meetingCalled", (data) => {
      setGame((prev: Game | null) =>
        prev
          ? {
              ...prev,
              gameStatus: "discussion",
              meetingCalledBy: data.playerId,
            }
          : null
      );
    });

    SocketService.on("voteRecorded", (data) => {
      // Handle vote recording
    });

    SocketService.on("voteResult", (data) => {
      setGame((prev: Game | null) => {
        if (!prev) return null;
        return {
          ...prev,
          gameStatus: data.gameOver ? "ended" : "in-progress",
          winner: data.winner,
          deadPlayers: data.ejectedPlayerId
            ? [...prev.deadPlayers, data.ejectedPlayerId]
            : prev.deadPlayers,
        };
      });
    });

    SocketService.on("gameEnded", (data) => {
      setGame((prev: Game | null) =>
        prev ? { ...prev, gameStatus: "ended", winner: data.winner } : null
      );
    });

    // Clean up
    return () => {
      SocketService.leaveGame(gameId, playerId);
      SocketService.disconnect();
    };
  }, [gameId, playerId]);

  const submitTask = async (taskId: string, answer: string) => {
    try {
      const response = await gameAPI.submitTask(
        gameId,
        taskId,
        playerId,
        answer
      );
      if (response.data.isCorrect) {
        setTasks((prev: Task[]) =>
          prev.map((task: Task) =>
            task.taskId === taskId ? { ...task, status: "completed" } : task
          )
        );
      }
      return response.data;
    } catch (err) {
      setError("Failed to submit task");
      console.error(err);
      throw err;
    }
  };

  const callMeeting = async (reason: string) => {
    try {
      await gameAPI.callMeeting(gameId, playerId, reason);
    } catch (err) {
      setError("Failed to call meeting");
      console.error(err);
      throw err;
    }
  };

  const vote = async (votedPlayerId: string) => {
    try {
      await gameAPI.vote(gameId, playerId, votedPlayerId);
    } catch (err) {
      setError("Failed to submit vote");
      console.error(err);
      throw err;
    }
  };

  const sabotage = async (sabotageType: string) => {
    try {
      await gameAPI.sabotage(gameId, playerId, sabotageType);
    } catch (err) {
      setError("Failed to initiate sabotage");
      console.error(err);
      throw err;
    }
  };

  return {
    game,
    player,
    tasks,
    loading,
    error,
    submitTask,
    callMeeting,
    vote,
    sabotage,
  };
};
