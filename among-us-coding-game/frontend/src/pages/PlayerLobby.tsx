import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gameAPI } from "../services/api";
import SocketService from "../services/socket";
import GroupsIcon from '@mui/icons-material/Groups';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import LockIcon from '@mui/icons-material/Lock';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const PlayerLobby = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<any[]>([]);
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);

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

    const handleGameStarted = (data: any) => {
      console.log("Game started with data:", data);
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

  const copyGameId = () => {
    navigator.clipboard.writeText(gameId || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Monochrome player color palette - subtle grays
  const playerColors = [
    "bg-slate-600",
    "bg-slate-700",
    "bg-gray-600",
    "bg-gray-700",
    "bg-zinc-600",
    "bg-zinc-700",
    "bg-neutral-600",
    "bg-neutral-700",
    "bg-stone-600",
    "bg-stone-700",
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gray-400 mb-4"></div>
          <div className="text-2xl font-bold text-gray-100 animate-pulse">
            Loading lobby...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 flex items-center justify-center p-4">
        <div className="bg-red-500/20 backdrop-blur-md border-2 border-red-500 text-white p-8 rounded-2xl max-w-md w-full shadow-2xl">
          <div className="flex justify-center mb-4">
            <WarningAmberIcon sx={{ fontSize: 64, color: '#ef4444' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-center">Error</h2>
          <p className="text-center mb-4">{error}</p>
          <div className="text-sm text-red-200 text-center">
            Please check the browser console for more details.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements - subtle monochrome */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-4xl relative z-10">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
                Game Lobby
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm font-medium">Game ID:</span>
                <code className="bg-gray-900/60 px-4 py-2 rounded-lg font-mono text-gray-300 text-sm border border-gray-700/50 tracking-wider">
                  {gameId}
                </code>
                <button
                  onClick={copyGameId}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 border border-gray-600/50"
                >
                  {copied ? (
                    <>
                      <CheckCircleIcon sx={{ fontSize: 18 }} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <ContentCopyIcon sx={{ fontSize: 18 }} />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="bg-gray-900/60 px-6 py-4 rounded-2xl border border-gray-700/50 shadow-lg">
              <div className="text-4xl font-black text-white">
                {players.length}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                Players
              </div>
            </div>
          </div>

          {/* Waiting status */}
          {players.length < 2 && (
            <div className="mt-4 bg-gray-800/40 border border-gray-600/50 rounded-xl p-4 flex items-center gap-3">
              <HourglassEmptyIcon className="animate-pulse" sx={{ fontSize: 28, color: '#9ca3af' }} />
              <span className="text-gray-300 font-medium">
                Waiting for more players... (minimum 2 required)
              </span>
            </div>
          )}
        </div>

        {/* Players Grid */}
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-700/50">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <GroupsIcon sx={{ fontSize: 32 }} />
            Players in Lobby
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {players.map((player, index) => (
              <div
                key={player.playerId}
                className="group relative bg-gradient-to-br from-gray-800/80 to-slate-800/80 p-5 rounded-2xl border border-gray-700/50 hover:border-gray-500/70 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-gray-900/50 animate-fadeIn"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Player color indicator */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 ${
                      playerColors[index % playerColors.length]
                    } rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 border-2 border-gray-600/50`}
                  >
                    <span className="text-white text-xl font-bold">
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate text-lg">
                      {player.name}
                    </div>
                    {players[0]?.playerId === player.playerId && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-gray-600 to-slate-600 text-white px-3 py-1 rounded-full font-bold shadow-md border border-gray-500/30">
                          Host
                        </span>
                      </div>
                    )}
                    {players[0]?.playerId !== player.playerId && (
                      <div className="text-xs text-gray-400 mt-1">Player</div>
                    )}
                  </div>
                </div>

                {/* Online indicator */}
                <div className="absolute top-3 right-3">
                  <div className="relative">
                    <FiberManualRecordIcon sx={{ fontSize: 12, color: '#10b981' }} />
                    <div className="absolute inset-0">
                      <FiberManualRecordIcon 
                        className="animate-ping" 
                        sx={{ fontSize: 12, color: '#10b981' }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {[...Array(Math.max(0, 6 - players.length))].map((_, index) => (
              <div
                key={`empty-${index}`}
                className="bg-gray-800/30 p-5 rounded-2xl border-2 border-dashed border-gray-700/50 flex items-center justify-center"
              >
                <span className="text-gray-500 text-sm font-medium">
                  Waiting for player...
                </span>
              </div>
            ))}
          </div>

          {/* Start Game Button */}
          {isHost && (
            <div className="mt-8">
              <button
                onClick={handleStartGame}
                disabled={players.length < 2}
                className={`group relative w-full py-5 px-6 rounded-2xl font-black text-xl text-white transition-all duration-300 overflow-hidden ${
                  players.length < 2
                    ? "bg-gray-700 cursor-not-allowed opacity-50 border border-gray-600/50"
                    : "bg-gradient-to-r from-gray-700 to-slate-700 hover:from-gray-600 hover:to-slate-600 hover:scale-105 hover:shadow-2xl hover:shadow-gray-900/50 active:scale-95 border border-gray-600/50"
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {players.length < 2 ? (
                    <>
                      <LockIcon sx={{ fontSize: 28 }} />
                      Need at least 2 players to start
                    </>
                  ) : (
                    <>
                      <RocketLaunchIcon sx={{ fontSize: 28 }} />
                      Start Game
                    </>
                  )}
                </span>
                {players.length >= 2 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-full animate-shimmer"></div>
                )}
              </button>
            </div>
          )}

          {!isHost && players.length >= 2 && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 bg-gray-800/40 border border-gray-600/50 text-gray-300 px-6 py-3 rounded-xl">
                <AccessTimeIcon className="animate-pulse" sx={{ fontSize: 24 }} />
                <span className="font-semibold">
                  Waiting for host to start the game...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add custom animations to your CSS/Tailwind config */}
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
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default PlayerLobby;
