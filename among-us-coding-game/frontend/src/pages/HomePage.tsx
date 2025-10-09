import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gameAPI, playerAPI } from "../services/api";
import PersonIcon from '@mui/icons-material/Person';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LoginIcon from '@mui/icons-material/Login';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import CircularProgress from '@mui/material/CircularProgress';
import FlashAutoIcon from '@mui/icons-material/FlashAuto';
import CloseIcon from '@mui/icons-material/Close';
import GroupsIcon from '@mui/icons-material/Groups';

const HomePage = () => {
  const [playerName, setPlayerName] = useState("");
  const [creatingGame, setCreatingGame] = useState(false);
  const [joiningGame, setJoiningGame] = useState(false);
  const [gameId, setGameId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAvailableGames, setShowAvailableGames] = useState(false);
  const [availableGames, setAvailableGames] = useState([]);
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

  const fetchAvailableGames = async () => {
    try {
      setLoading(true);
      const response = await gameAPI.getAvailableGames();
      setAvailableGames(response.data);
      setShowAvailableGames(true);
      setError("");
    } catch (err) {
      setError("Failed to fetch available games");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const joinAvailableGame = async (selectedGameId) => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Register the player and add them to the game at the same time
      const playerResponse = await playerAPI.register(playerName, selectedGameId);
      const { player, token } = playerResponse.data;

      // Save token to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("playerId", player.playerId);

      // Navigate to lobby
      navigate(`/lobby/${selectedGameId}`);
    } catch (err) {
      setError("Failed to join game");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/2 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-xl p-6 rounded-3xl border border-gray-700/50 shadow-2xl">
              <SportsEsportsIcon sx={{ fontSize: 64, color: '#ffffff' }} />
            </div>
          </div>
          <h1 className="text-5xl font-black text-white mb-3 tracking-tight">
            Among Us
          </h1>
          <p className="text-xl text-gray-400 font-semibold">Coding Game</p>
          <p className="text-sm text-gray-500 mt-2">Test your coding skills while hunting impostors</p>
        </div>

        {/* Main Card */}
        <div className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-700/50 animate-fadeIn delay-200">
          {error && (
            <div className="bg-red-500/20 border-2 border-red-500/50 text-red-300 p-4 rounded-xl mb-6 flex items-center gap-3 animate-shake">
              <div className="text-2xl">⚠️</div>
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Player Name Input */}
            <div className="animate-fadeIn delay-300">
              <label
                htmlFor="playerName"
                className="flex items-center gap-2 text-sm font-bold mb-3 text-gray-300 uppercase tracking-wider"
              >
                <PersonIcon sx={{ fontSize: 18 }} />
                Your Name
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-gray-900/60 text-white placeholder-gray-500 transition-all duration-200 font-medium"
                placeholder="Enter your name"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 animate-fadeIn delay-400">
              {/* Create Game Button */}
              <button
                onClick={handleCreateGame}
                disabled={loading}
                className="group relative w-full bg-gradient-to-r from-gray-700 to-slate-700 hover:from-gray-600 hover:to-slate-600 text-white font-black py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 border border-gray-600/50 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-gray-900/50"
              >
                <span className="relative z-10 flex items-center justify-center gap-3 text-lg">
                  {loading ? (
                    <>
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                      Creating...
                    </>
                  ) : (
                    <>
                      <AddCircleOutlineIcon sx={{ fontSize: 28 }} />
                      Create New Game
                    </>
                  )}
                </span>
                {!loading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-full animate-shimmer"></div>
                )}
              </button>

              {/* View Available Games Button */}
              <button
                onClick={fetchAvailableGames}
                disabled={loading}
                className="group relative w-full bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-black py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 border border-blue-600/50 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-blue-900/50"
              >
                <span className="relative z-10 flex items-center justify-center gap-3 text-lg">
                  {loading ? (
                    <>
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                      Loading...
                    </>
                  ) : (
                    <>
                      <GroupsIcon sx={{ fontSize: 28 }} />
                      View Available Games
                    </>
                  )}
                </span>
                {!loading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-full animate-shimmer"></div>
                )}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-700/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gradient-to-r from-transparent via-slate-800 to-transparent text-gray-400 font-bold uppercase tracking-wider">
                    or
                  </span>
                </div>
              </div>

              {/* Join Game Section */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-gray-900/60 text-white placeholder-gray-500 transition-all duration-200 font-medium"
                  placeholder="Enter Game ID"
                />
                <button
                  onClick={handleJoinGame}
                  disabled={loading}
                  className="group relative w-full bg-gradient-to-r from-slate-700 to-gray-700 hover:from-slate-600 hover:to-gray-600 text-white font-black py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 border border-gray-600/50 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-gray-900/50"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3 text-lg">
                    {loading ? (
                      <>
                        <CircularProgress size={24} sx={{ color: 'white' }} />
                        Joining...
                      </>
                    ) : (
                      <>
                        <LoginIcon sx={{ fontSize: 28 }} />
                        Join Existing Game
                      </>
                    )}
                  </span>
                  {!loading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-full animate-shimmer"></div>
                  )}
                </button>
              </div>
            </div>

            {/* Admin Dashboard Link */}
            <div className="pt-4 border-t-2 border-gray-700/50 animate-fadeIn delay-500">
              <button
                onClick={() => navigate("/admin")}
                className="w-full bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 hover:text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 border border-gray-700/50 hover:border-gray-600/70 flex items-center justify-center gap-3"
              >
                <AdminPanelSettingsIcon sx={{ fontSize: 24 }} />
                Admin Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Available Games Modal */}
        {showAvailableGames && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-gradient-to-br from-slate-800/80 to-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 w-full max-w-md max-h-[80vh] overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">Available Games</h2>
                  <button 
                    onClick={() => setShowAvailableGames(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <CloseIcon sx={{ fontSize: 32 }} />
                  </button>
                </div>

                <div className="mb-4 text-gray-300">
                  {availableGames.length === 0 ? (
                    <p className="text-center py-4">No available games found. Create a new game!</p>
                  ) : (
                    <p className="text-center">Select a game to join</p>
                  )}
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                  {availableGames.map((game) => (
                    <div 
                      key={game.gameId}
                      className="bg-gray-900/60 hover:bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 transition-all duration-200 cursor-pointer group"
                      onClick={() => joinAvailableGame(game.gameId)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-white text-lg">{game.gameId}</h3>
                          <p className="text-gray-400 text-sm">
                            {game.players.length} player{game.players.length !== 1 ? 's' : ''} waiting
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                            Join
                          </span>
                        </div>
                      </div>
                      
                      {game.players.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-700/50">
                          <p className="text-gray-400 text-xs mb-1">Players:</p>
                          <div className="flex flex-wrap gap-2">
                            {game.players.slice(0, 3).map((player) => (
                              <span 
                                key={player.playerId} 
                                className="bg-gray-700/50 text-gray-300 px-2 py-1 rounded-lg text-xs"
                              >
                                {player.name}
                              </span>
                            ))}
                            {game.players.length > 3 && (
                              <span className="bg-gray-700/50 text-gray-300 px-2 py-1 rounded-lg text-xs">
                                +{game.players.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setShowAvailableGames(false)}
                    className="w-full bg-gray-700/60 hover:bg-gray-600/60 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 border border-gray-600/50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-gray-500 text-sm animate-fadeIn delay-600">
          <p>Complete coding tasks and find the impostor</p>
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

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }

        .delay-300 {
          animation-delay: 0.3s;
        }

        .delay-400 {
          animation-delay: 0.4s;
        }

        .delay-500 {
          animation-delay: 0.5s;
        }

        .delay-600 {
          animation-delay: 0.6s;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default HomePage;