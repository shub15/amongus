import React, { useEffect, useState } from "react";
import { playerAPI, gameAPI } from "../services/api";

const AdminDashboard = () => {
  const [players, setPlayers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const playersResponse = await playerAPI.getPlayers();
      setPlayers(playersResponse.data);

      // For now, we'll just show a placeholder for games
      // In a real implementation, you would fetch actual games
      setGames([]);
    } catch (err) {
      setError("Failed to fetch data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (playerId: string, role: string) => {
    try {
      await playerAPI.assignRole(playerId, role);
      // Refresh the player list
      fetchData();
    } catch (err) {
      setError("Failed to assign role");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-500 text-white p-4 rounded">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-amongus-red">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Players Section */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Players</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="py-2 px-4 text-left">Name</th>
                    <th className="py-2 px-4 text-left">Role</th>
                    <th className="py-2 px-4 text-left">Status</th>
                    <th className="py-2 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr
                      key={player.playerId}
                      className="border-b border-slate-700"
                    >
                      <td className="py-2 px-4">{player.name}</td>
                      <td className="py-2 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            player.role === "imposter"
                              ? "bg-red-500"
                              : player.role === "ghost"
                              ? "bg-purple-500"
                              : "bg-green-500"
                          }`}
                        >
                          {player.role}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            player.status === "alive"
                              ? "bg-green-500"
                              : player.status === "dead"
                              ? "bg-red-500"
                              : "bg-gray-500"
                          }`}
                        >
                          {player.status}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              handleAssignRole(player.playerId, "crewmate")
                            }
                            className="text-xs bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded"
                          >
                            Make Crewmate
                          </button>
                          <button
                            onClick={() =>
                              handleAssignRole(player.playerId, "imposter")
                            }
                            className="text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
                          >
                            Make Impostor
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Games Section */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Games</h2>
            <div className="mb-4">
              <button
                onClick={async () => {
                  try {
                    const response = await gameAPI.createGame(1);
                    console.log("Game created:", response.data);
                    // Refresh games list
                  } catch (err) {
                    setError("Failed to create game");
                    console.error(err);
                  }
                }}
                className="bg-amongus-green hover:bg-green-600 text-white py-2 px-4 rounded"
              >
                Create New Game
              </button>
            </div>

            {games.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                No active games
              </div>
            ) : (
              <div className="space-y-4">
                {games.map((game) => (
                  <div
                    key={game.gameId}
                    className="bg-slate-700 p-4 rounded-lg"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold">
                          Game #{game.gameId.slice(0, 8)}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {game.players.length} players • Status:{" "}
                          {game.gameStatus}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          Created: {new Date(game.createdAt).toLocaleString()}
                        </div>
                        {game.startedAt && (
                          <div className="text-sm">
                            Started: {new Date(game.startedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <button className="text-xs bg-amongus-blue hover:bg-blue-600 text-white py-1 px-2 rounded">
                        View Details
                      </button>
                      <button className="text-xs bg-amongus-red hover:bg-red-600 text-white py-1 px-2 rounded">
                        End Game
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
