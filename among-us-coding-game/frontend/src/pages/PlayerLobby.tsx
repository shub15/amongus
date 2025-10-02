import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gameAPI } from "../services/api";
import SocketService from "../services/socket";

const PlayerLobby = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<any[]>([]);
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isHost, setIsHost] = useState(false);

  // Memoized fetch game data function
  const fetchGameData = useCallback(async () => {
    if (!gameId) return;

    try {
      setLoading(true);
      console.log("Fetching game data for gameId:", gameId);
      const response = await gameAPI.getGame(gameId);
      console.log("Game data response:", response);
      setGame(response.data);
      setPlayers(response.data.players);

      // Check if current player is the host (first player)
      const playerId = localStorage.getItem("playerId");
      if (response.data.players.length > 0 && playerId) {
        setIsHost(response.data.players[0].playerId === playerId);
      }
    } catch (err) {
      console.error("Error fetching game data:", err);
      setError("Failed to fetch game data");
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;

    // Connect to socket
    SocketService.connect();

    // Join the game room
    const playerId = localStorage.getItem("playerId");
    if (playerId) {
      SocketService.joinGame(gameId, playerId);
    }

    // Fetch initial game data
    fetchGameData();

    // Set up socket listeners
    const handlePlayerJoined = (data: any) => {
      console.log("Player joined:", data);
      setPlayers((prev) => {
        // Check if player already exists
        const exists = prev.some((p) => p.playerId === data.playerId);
        if (!exists) {
          return [...prev, { playerId: data.playerId, name: data.name }];
        }
        return prev;
      });
    };

    const handleGameStarted = () => {
      navigate(`/game/${gameId}`);
    };

    SocketService.on("playerJoined", handlePlayerJoined);
    SocketService.on("gameStarted", handleGameStarted);

    // Clean up
    return () => {
      const playerId = localStorage.getItem("playerId");
      if (playerId && gameId) {
        SocketService.leaveGame(gameId, playerId);
      }
      SocketService.off("playerJoined", handlePlayerJoined);
      SocketService.off("gameStarted", handleGameStarted);
    };
  }, [gameId, navigate, fetchGameData]);

  const handleStartGame = async () => {
    try {
      await gameAPI.startGame(gameId!);
      // The socket listener will handle navigation to the game page
    } catch (err) {
      setError("Failed to start game");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading lobby...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-500 text-white p-4 rounded">
          Error: {error}
          <div className="mt-2 text-sm">
            Please check the browser console for more details.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-800 rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-amongus-red">
          Game Lobby
        </h1>
        <p className="text-center text-gray-400 mb-8">Game ID: {gameId}</p>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Players ({players.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {players.map((player) => (
              <div
                key={player.playerId}
                className="bg-slate-700 p-4 rounded-lg flex items-center"
              >
                <div className="w-3 h-3 rounded-full bg-amongus-green mr-3"></div>
                <span>{player.name}</span>
                {players[0]?.playerId === player.playerId && (
                  <span className="ml-2 text-xs bg-amongus-blue text-white px-2 py-1 rounded">
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <div className="mt-8">
            <button
              onClick={handleStartGame}
              disabled={players.length < 2}
              className={`w-full py-3 px-4 rounded font-bold text-white transition duration-200 ${
                players.length < 2
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-amongus-green hover:bg-green-600"
              }`}
            >
              {players.length < 2
                ? "Need at least 2 players to start"
                : "Start Game"}
            </button>
          </div>
        )}

        {players.length < 2 && !isHost && (
          <div className="mt-4 text-center text-gray-400">
            Waiting for more players... (at least 2 required)
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerLobby;
