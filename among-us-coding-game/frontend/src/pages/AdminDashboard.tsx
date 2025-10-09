import { useEffect, useState } from "react";
import { playerAPI, gameAPI } from "../services/api";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import PeopleIcon from "@mui/icons-material/People";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RefreshIcon from "@mui/icons-material/Refresh";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import CircularProgress from "@mui/material/CircularProgress";
import HomeIcon from "@mui/icons-material/Home";
import DeleteIcon from "@mui/icons-material/Delete";

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
      const gamesResponse = await gameAPI.getAllGames();

      setPlayers(playersResponse.data);
      setGames(gamesResponse.data);
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
      fetchData();
    } catch (err) {
      setError("Failed to assign role");
      console.error(err);
    }
  };

  const handleKickPlayer = async (playerId: string, gameId: string) => {
    try {
      if (window.confirm("Are you sure you want to kick this player?")) {
        await gameAPI.kickPlayer(gameId, playerId);
        fetchData();
      }
    } catch (err) {
      setError("Failed to kick player");
      console.error(err);
    }
  };

  const handleEndGame = async (gameId: string) => {
    try {
      await gameAPI.endGame(gameId);
      fetchData();
    } catch (err) {
      setError("Failed to end game");
      console.error(err);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    try {
      if (
        window.confirm(
          "Are you sure you want to delete this game? This action cannot be undone."
        )
      ) {
        await gameAPI.deleteGame(gameId);
        fetchData();
      }
    } catch (err) {
      setError("Failed to delete game");
      console.error(err);
    }
  };

  const handleStartGame = async (gameId: string) => {
    try {
      await gameAPI.startGame(gameId);
      fetchData();
    } catch (err) {
      setError("Failed to start game");
      console.error(err);
    }
  };

  const handleCreateGame = async () => {
    try {
      const response = await gameAPI.createGame(1);
      console.log("Game created:", response.data);
      fetchData();
    } catch (err) {
      setError("Failed to create game");
      console.error(err);
    }
  };

  // Calculate stats
  const activeGames = games.filter((g) => g.gameStatus !== "ended").length;
  const totalPlayers = players.length;
  const gamesInProgress = games.filter(
    (g) => g.gameStatus === "in-progress"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <CircularProgress size={64} sx={{ color: "#9ca3af", mb: 2 }} />
          <div className="text-2xl font-bold text-gray-100 animate-pulse mt-4">
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 flex items-center justify-center p-4">
        <div className="bg-red-500/20 backdrop-blur-md border-2 border-red-500 text-white p-8 rounded-2xl max-w-md w-full shadow-2xl">
          <div className="text-2xl mb-4 text-center">⚠️</div>
          <h2 className="text-2xl font-bold mb-2 text-center">Error</h2>
          <p className="text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 text-gray-100 p-4 md:p-8">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <DashboardIcon sx={{ fontSize: 40, color: "#ffffff" }} />
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                  Admin Dashboard
                </h1>
              </div>
              <p className="text-gray-400 ml-1">
                Manage games and monitor activity
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchData}
                className="flex items-center gap-2 bg-gray-800/60 hover:bg-gray-700/60 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-200 border border-gray-700/50 hover:scale-105"
              >
                <RefreshIcon sx={{ fontSize: 20 }} />
                Refresh
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="flex items-center gap-2 bg-gray-800/60 hover:bg-gray-700/60 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-200 border border-gray-700/50 hover:scale-105"
              >
                <HomeIcon sx={{ fontSize: 20 }} />
                Home
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fadeIn delay-200">
          <div className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">
                  Active Games
                </p>
                <p className="text-4xl font-black text-white">{activeGames}</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-xl">
                <SportsEsportsIcon sx={{ fontSize: 40, color: "#ffffff" }} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">
                  Total Players
                </p>
                <p className="text-4xl font-black text-white">{totalPlayers}</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-xl">
                <PeopleIcon sx={{ fontSize: 40, color: "#ffffff" }} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">
                  In Progress
                </p>
                <p className="text-4xl font-black text-white">
                  {gamesInProgress}
                </p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-xl">
                <AccessTimeIcon sx={{ fontSize: 40, color: "#ffffff" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Games Section */}
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700/50 animate-fadeIn delay-300">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <SportsEsportsIcon sx={{ fontSize: 28 }} />
              Game Management
            </h2>
            <button
              onClick={handleCreateGame}
              className="group relative bg-gradient-to-r from-gray-700 to-slate-700 hover:from-gray-600 hover:to-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 border border-gray-600/50 overflow-hidden shadow-lg flex items-center gap-2 justify-center"
            >
              <AddCircleOutlineIcon sx={{ fontSize: 24 }} />
              Create New Game
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-full animate-shimmer"></div>
            </button>
          </div>

          {games.length === 0 ? (
            <div className="text-center py-16">
              <SportsEsportsIcon
                sx={{ fontSize: 64, color: "#4b5563", mb: 2 }}
              />
              <p className="text-gray-400 text-lg font-semibold mt-4">
                No active games
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Create a new game to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {games.map((game) => (
                <div
                  key={game.gameId}
                  className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 p-6 rounded-xl border border-gray-700/50 hover:border-gray-600/70 transition-all duration-300 hover:scale-[1.02]"
                >
                  {/* Game Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">
                          Game #{game.gameId.slice(0, 8)}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                            game.gameStatus === "waiting"
                              ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300"
                              : game.gameStatus === "in-progress"
                              ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                              : game.gameStatus === "ended"
                              ? "bg-gray-600/20 border-gray-600/50 text-gray-400"
                              : "bg-purple-500/20 border-purple-500/50 text-purple-300"
                          }`}
                        >
                          {game.gameStatus.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <PeopleIcon sx={{ fontSize: 16 }} />
                        <span className="font-semibold text-white">
                          {game.players.length}
                        </span>{" "}
                        players
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div className="flex items-center gap-2">
                        <AccessTimeIcon sx={{ fontSize: 16 }} />
                        Created: {new Date(game.createdAt).toLocaleString()}
                      </div>
                      {game.startedAt && (
                        <div className="flex items-center gap-2">
                          <FiberManualRecordIcon
                            sx={{ fontSize: 12, color: "#10b981" }}
                          />
                          Started: {new Date(game.startedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Players Grid */}
                  <div className="mb-4">
                    <h4 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-3">
                      Players in Game
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {game.players.map((player: any) => (
                        <div
                          key={player.playerId}
                          className="flex items-center justify-between bg-gray-900/60 px-4 py-3 rounded-lg border border-gray-700/50 hover:border-gray-600/70 transition-all duration-200"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FiberManualRecordIcon
                              sx={{
                                fontSize: 12,
                                color:
                                  player.status === "alive"
                                    ? "#10b981"
                                    : "#6b7280",
                              }}
                            />
                            <span className="font-semibold text-white truncate">
                              {player.name}
                            </span>
                            <div className="flex gap-1">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  player.role === "imposter"
                                    ? "bg-red-500/20 text-red-300"
                                    : player.role === "ghost"
                                    ? "bg-purple-500/20 text-purple-300"
                                    : "bg-green-500/20 text-green-300"
                                }`}
                              >
                                {player.role.charAt(0).toUpperCase()}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  player.status === "alive"
                                    ? "bg-green-500/20 text-green-300"
                                    : "bg-red-500/20 text-red-300"
                                }`}
                              >
                                {player.status.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded font-semibold">
                              {player.completedTasks?.length || 0} tasks
                            </span>
                            <button
                              onClick={() =>
                                handleKickPlayer(player.playerId, game.gameId)
                              }
                              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 flex items-center gap-1"
                            >
                              <PersonRemoveIcon sx={{ fontSize: 14 }} />
                              Kick
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-700/50">
                    <button
                      onClick={() =>
                        alert(`Viewing details for game ${game.gameId}`)
                      }
                      className="flex items-center gap-2 bg-gray-700/50 hover:bg-gray-600/50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border border-gray-600/50 hover:scale-105"
                    >
                      <VisibilityIcon sx={{ fontSize: 18 }} />
                      View Details
                    </button>
                    <button
                      onClick={() => handleStartGame(game.gameId)}
                      disabled={game.gameStatus !== "waiting"}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border ${
                        game.gameStatus !== "waiting"
                          ? "bg-gray-700/30 border-gray-600/30 text-gray-500 cursor-not-allowed"
                          : "bg-green-500/20 hover:bg-green-500/30 border-green-500/50 text-green-300 hover:scale-105"
                      }`}
                    >
                      <SportsEsportsIcon sx={{ fontSize: 18 }} />
                      Start Game
                    </button>
                    <button
                      onClick={() => handleEndGame(game.gameId)}
                      disabled={game.gameStatus === "ended"}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border ${
                        game.gameStatus === "ended"
                          ? "bg-gray-700/30 border-gray-600/30 text-gray-500 cursor-not-allowed"
                          : "bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-300 hover:scale-105"
                      }`}
                    >
                      <StopCircleIcon sx={{ fontSize: 18 }} />
                      End Game
                    </button>
                    <button
                      onClick={() => handleDeleteGame(game.gameId)}
                      className="flex items-center gap-2 bg-red-500/30 hover:bg-red-500/40 text-red-300 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border border-red-500/50 hover:scale-105"
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                      Delete Game
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }

        .delay-300 {
          animation-delay: 0.3s;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
