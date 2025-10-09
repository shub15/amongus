import { useState, useEffect } from "react";
import { Game, Player, Task } from "../types";
import SocketService from "../services/socket";
import { gameAPI, taskAPI } from "../services/api";

export const useGameState = (gameId: string, playerId: string) => {
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [map, setMap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emergencyTask, setEmergencyTask] = useState<Task | null>(null);
  const [sabotageDeadline, setSabotageDeadline] = useState<Date | null>(null);

  useEffect(() => {
    // Connect to socket
    SocketService.connect();

    // Join the game room
    SocketService.joinGame(gameId, playerId);

    // Fetch initial game data
    const fetchGameData = async () => {
      try {
        setLoading(true);
        const gameResponse = await gameAPI.getGame(gameId);
        setGame(gameResponse.data);
        setPlayers(gameResponse.data.players);
        setTasks(gameResponse.data.tasks);
        setMap(gameResponse.data.map || []);

        // Check if there's an active emergency task
        const activeEmergencyTask = gameResponse.data.tasks.find(
          (task: any) => task.isEmergency && task.status === "pending"
        );
        if (activeEmergencyTask) {
          setEmergencyTask(activeEmergencyTask);
          if (gameResponse.data.sabotageDeadline) {
            setSabotageDeadline(new Date(gameResponse.data.sabotageDeadline));
          }
        }
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
      setGame((prev) =>
        prev ? { ...prev, ...data, gameStatus: "in-progress" } : null
      );
      setPlayers(data.players);
      setTasks(data.tasks);
      setMap(data.map || []);
    });

    SocketService.on("taskSubmitted", (data) => {
      // Update task status only for the current player or for emergency tasks
      setTasks((prev) =>
        prev.map((task) =>
          task.taskId === data.taskId
            ? { ...task, status: data.isCorrect ? "completed" : "failed" }
            : task
        )
      );
    });

    SocketService.on("sabotageAlert", (data) => {
      setGame((prev) =>
        prev ? { ...prev, currentSabotage: data.sabotageType } : null
      );
    });

    SocketService.on("sabotage", (data) => {
      // Handle sabotage with emergency task
      setGame((prev) =>
        prev ? { ...prev, currentSabotage: data.sabotageType } : null
      );

      // Set emergency task and deadline
      if (data.emergencyTask) {
        setEmergencyTask(data.emergencyTask);
        setTasks((prev) => [...prev, data.emergencyTask]);
      }

      if (data.deadline) {
        setSabotageDeadline(new Date(data.deadline));
      }
    });

    SocketService.on("sabotageCleared", (data) => {
      // Clear sabotage and emergency task
      setGame((prev) => (prev ? { ...prev, currentSabotage: null } : null));
      setEmergencyTask(null);
      setSabotageDeadline(null);

      // Update the emergency task status if it exists in tasks
      setTasks((prev) =>
        prev.map((task) =>
          task.taskId === data.taskId ? { ...task, status: "completed" } : task
        )
      );
    });

    SocketService.on("meetingCalled", (data) => {
      setGame((prev) =>
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
      setGame((prev) => {
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
      setGame((prev) =>
        prev ? { ...prev, gameStatus: "ended", winner: data.winner } : null
      );
    });

    SocketService.on("playerMoved", (data) => {
      setPlayers((prev) =>
        prev.map((player) =>
          player.playerId === data.playerId
            ? { ...player, currentRoom: data.roomName }
            : player
        )
      );
    });

    SocketService.on("playerVentMove", (data) => {
      setPlayers((prev) =>
        prev.map((player) =>
          player.playerId === data.playerId
            ? { ...player, currentRoom: data.targetRoom, isVenting: true }
            : player
        )
      );

      // Reset venting status after a short delay
      setTimeout(() => {
        setPlayers((prev) =>
          prev.map((player) =>
            player.playerId === data.playerId
              ? { ...player, isVenting: false }
              : player
          )
        );
      }, 2000);
    });

    SocketService.on("playerKilled", (data) => {
      setPlayers((prev) =>
        prev.map((player) =>
          player.playerId === data.targetId
            ? { ...player, status: "dead" }
            : player
        )
      );
    });

    SocketService.on("bodyReported", (data) => {
      // Handle body report - could trigger a meeting
      setGame((prev) => (prev ? { ...prev, gameStatus: "discussion" } : null));
    });

    SocketService.on("playerJoined", (data) => {
      // Add new player to players list
      // In a real implementation, you'd fetch the full player data
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
        setTasks((prev) =>
          prev.map((task) =>
            task.taskId === taskId ? { ...task, status: "completed" } : task
          )
        );

        // If this was the emergency task, clear it
        if (response.data.task.isEmergency) {
          setEmergencyTask(null);
          setSabotageDeadline(null);
        }
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

  const movePlayer = async (roomName: string) => {
    try {
      await gameAPI.movePlayer(gameId, playerId, roomName);
    } catch (err) {
      setError("Failed to move player");
      console.error(err);
      throw err;
    }
  };

  const useVent = async (targetRoom: string) => {
    try {
      await gameAPI.useVent(gameId, playerId, targetRoom);
    } catch (err) {
      setError("Failed to use vent");
      console.error(err);
      throw err;
    }
  };

  const killPlayer = async (targetId: string) => {
    try {
      await gameAPI.killPlayer(gameId, playerId, targetId);
    } catch (err) {
      setError("Failed to kill player");
      console.error(err);
      throw err;
    }
  };

  const reportBody = async (deadPlayerId: string) => {
    try {
      await gameAPI.reportBody(gameId, playerId, deadPlayerId);
    } catch (err) {
      setError("Failed to report body");
      console.error(err);
      throw err;
    }
  };

  return {
    game,
    players,
    tasks,
    map,
    emergencyTask,
    sabotageDeadline,
    loading,
    error,
    submitTask,
    callMeeting,
    vote,
    sabotage,
    movePlayer,
    useVent,
    killPlayer,
    reportBody,
  };
};
