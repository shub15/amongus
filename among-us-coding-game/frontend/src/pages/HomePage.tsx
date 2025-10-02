import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { gameAPI, playerAPI } from "../services/api";

const HomePage = () => {
  const [playerName, setPlayerName] = useState("");
  const [creatingGame, setCreatingGame] = useState(false);
  const [joiningGame, setJoiningGame] = useState(false);
  const [gameId, setGameId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create a new game
      const gameResponse = await gameAPI.createGame(1);
      const gameId = gameResponse.data.gameId;

      // Register the player and add them to the game at the same time
      const playerResponse = await playerAPI.register(playerName, gameId);
      const { player, token } = playerResponse.data;

      // Save token to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("playerId", player.playerId);

      // Navigate to lobby
      navigate(`/lobby/${gameId}`);
    } catch (err) {
      setError("Failed to create game");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!gameId.trim()) {
      setError("Please enter a game ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Register the player and add them to the game at the same time
      const playerResponse = await playerAPI.register(playerName, gameId);
      const { player, token } = playerResponse.data;

      // Save token to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("playerId", player.playerId);

      // Navigate to lobby
      navigate(`/lobby/${gameId}`);
    } catch (err) {
      setError("Failed to join game");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-amongus-red">
          Among Us Coding Game
        </h1>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>
        )}

        <div className="space-y-6">
          <div>
            <label
              htmlFor="playerName"
              className="block text-sm font-medium mb-2"
            >
              Your Name
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amongus-blue bg-slate-700 text-white"
              placeholder="Enter your name"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleCreateGame}
              disabled={loading}
              className="flex-1 bg-amongus-green hover:bg-green-600 text-white font-bold py-3 px-4 rounded transition duration-200 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Game"}
            </button>

            <div className="w-full border-t border-gray-600 my-4 sm:hidden"></div>

            <div className="flex-1 space-y-4">
              <input
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amongus-blue bg-slate-700 text-white"
                placeholder="Enter Game ID"
              />
              <button
                onClick={handleJoinGame}
                disabled={loading}
                className="w-full bg-amongus-blue hover:bg-blue-600 text-white font-bold py-3 px-4 rounded transition duration-200 disabled:opacity-50"
              >
                {loading ? "Joining..." : "Join Game"}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <button
              onClick={() => navigate("/admin")}
              className="w-full bg-amongus-purple hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition duration-200"
            >
              Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
