import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useGameState } from "../hooks/useGameState";
import GameMap from "../components/GameMap";
import GroupsIcon from '@mui/icons-material/Groups';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import CampaignIcon from '@mui/icons-material/Campaign';
import TimerIcon from '@mui/icons-material/Timer';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import ReplayIcon from '@mui/icons-material/Replay';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const GamePage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const playerId = localStorage.getItem("playerId") || "";
  const {
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
  } = useGameState(gameId!, playerId);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [showMeetingButton, setShowMeetingButton] = useState(true);
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [taskResult, setTaskResult] = useState<{
    isCorrect: boolean;
    message: string;
  } | null>(null);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  // Find current player
  useEffect(() => {
    if (players && playerId) {
      const player = players.find((p: any) => p.playerId === playerId);
      setCurrentPlayer(player);
    }
  }, [players, playerId]);

  // Timer for sabotage deadline
  useEffect(() => {
    if (!sabotageDeadline) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const deadline = new Date(sabotageDeadline).getTime();
      const difference = deadline - now;

      if (difference <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(Math.floor(difference / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sabotageDeadline]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gray-400 mb-4"></div>
          <div className="text-2xl font-bold text-gray-100 animate-pulse">
            Loading game...
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
          <p className="text-center">{error}</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 flex items-center justify-center">
        <div className="text-xl text-gray-300">Game not found</div>
      </div>
    );
  }

  // Check if player is impostor
  const isImpostor = currentPlayer?.role === "imposter";

  const handleTaskSubmit = async () => {
    if (!selectedTask || !answer) return;

    try {
      const result = await submitTask(selectedTask.taskId, answer);
      setTaskResult({
        isCorrect: result.isCorrect,
        message: result.isCorrect
          ? "Correct! Task completed."
          : "Incorrect! Please try again.",
      });

      setAnswer("");

      if (result.isCorrect) {
        setTimeout(() => {
          setSelectedTask(null);
          setTaskResult(null);
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to submit task", err);
      setTaskResult({
        isCorrect: false,
        message: "Error submitting task. Please try again.",
      });
    }
  };

  const handleCallMeeting = async (reason: string) => {
    try {
      await callMeeting(reason);
      setShowMeetingButton(false);
      setTimeout(() => setShowMeetingButton(true), 30000);
    } catch (err) {
      console.error("Failed to call meeting", err);
    }
  };

  const handleSabotage = async (sabotageType: string) => {
    try {
      await sabotage(sabotageType);
    } catch (err) {
      console.error("Failed to initiate sabotage", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 text-gray-100 p-4">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Collapsible Toggle Button */}
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
            className="bg-gradient-to-br from-slate-800/90 to-gray-800/90 backdrop-blur-xl hover:from-slate-700/90 hover:to-gray-700/90 text-white p-3 rounded-xl border border-gray-700/50 shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
            title={isHeaderCollapsed ? "Show Header" : "Hide Header"}
          >
            {isHeaderCollapsed ? (
              <ExpandMoreIcon sx={{ fontSize: 24 }} />
            ) : (
              <ExpandLessIcon sx={{ fontSize: 24 }} />
            )}
          </button>
        </div>

        {/* Game Header - Collapsible */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isHeaderCollapsed ? "max-h-0 opacity-0 mb-0" : "max-h-96 opacity-100 mb-6"
          }`}
        >
          <div className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-gray-700/50">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-black text-white mb-1 tracking-tight">
                  Among Us Coding Game
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                    <span>Game ID: <code className="text-gray-300 font-mono">{gameId}</code></span>
                  </div>
                  <div className="h-4 w-px bg-gray-600"></div>
                  <div>
                    Status: <span className="font-semibold text-white">{game.gameStatus}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Status Bar - Collapsible */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isHeaderCollapsed ? "max-h-0 opacity-0 mb-0" : "max-h-96 opacity-100 mb-6"
          }`}
        >
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-700/50">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <GroupsIcon sx={{ fontSize: 24, color: '#9ca3af' }} />
                  <span className="text-gray-300">
                    <span className="font-bold text-white">{players.filter((p: any) => p.status === "alive").length}</span> alive
                  </span>
                </div>
                <div className="h-6 w-px bg-gray-700"></div>
                <div className="text-gray-400">
                  <span className="font-bold text-gray-300">{players.filter((p: any) => p.status === "dead").length}</span> eliminated
                </div>
              </div>
              <div className="flex items-center gap-3">
                {game.currentSabotage && (
                  <span className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 px-4 py-2 rounded-lg text-red-300 text-sm font-semibold">
                    <WarningAmberIcon sx={{ fontSize: 18 }} />
                    Sabotage: {game.currentSabotage}
                  </span>
                )}
                {timeLeft !== null && timeLeft > 0 && (
                  <span className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/50 px-4 py-2 rounded-lg text-yellow-300 text-sm font-semibold">
                    <TimerIcon sx={{ fontSize: 18 }} />
                    {timeLeft}s
                  </span>
                )}
                {timeLeft === 0 && (
                  <span className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 px-4 py-2 rounded-lg text-red-300 text-sm font-semibold">
                    <WarningAmberIcon sx={{ fontSize: 18 }} />
                    Time's up!
                  </span>
                )}
              </div>
            </div>

            {/* Task Summary */}
            {currentPlayer && (
              <div className="mt-6 pt-6 border-t border-gray-700/50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <AssignmentIcon sx={{ fontSize: 22, color: '#9ca3af' }} />
                    <span className="font-bold text-white">Your Tasks</span>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon sx={{ fontSize: 18, color: '#10b981' }} />
                      <span className="text-green-400 font-semibold">
                        {tasks.filter((task: any) => task.assignedTo === currentPlayer.playerId && task.status === "completed").length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CancelIcon sx={{ fontSize: 18, color: '#ef4444' }} />
                      <span className="text-red-400 font-semibold">
                        {tasks.filter((task: any) => task.assignedTo === currentPlayer.playerId && task.status === "failed").length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PendingIcon sx={{ fontSize: 18, color: '#fbbf24' }} />
                      <span className="text-yellow-400 font-semibold">
                        {tasks.filter((task: any) => task.assignedTo === currentPlayer.playerId && task.status === "pending").length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player List */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-700/50">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                <GroupsIcon sx={{ fontSize: 26 }} />
                Players
              </h2>
              <div className="space-y-3">
                {players.map((player: any, index: number) => (
                  <div
                    key={player.playerId}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                      player.status === "dead"
                        ? "bg-red-900/30 border border-red-700/50"
                        : "bg-gradient-to-br from-gray-800/80 to-slate-800/80 border border-gray-700/50 hover:border-gray-600/70"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <FiberManualRecordIcon
                          sx={{
                            fontSize: 12,
                            color: player.status === "alive" ? "#10b981" : "#6b7280",
                          }}
                        />
                        {player.status === "alive" && (
                          <div className="absolute inset-0">
                            <FiberManualRecordIcon
                              className="animate-ping"
                              sx={{ fontSize: 12, color: "#10b981" }}
                            />
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-white">{player.name}</span>
                    </div>
                    {player.playerId === playerId && (
                      <span className="text-xs bg-gray-700 border border-gray-600/50 text-white px-3 py-1 rounded-full font-semibold">
                        You
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Map */}
            {map && (
              <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-700/50">
                <GameMap
                  gameId={gameId!}
                  playerId={playerId}
                  playerRole={currentPlayer?.role || "crewmate"}
                  players={players}
                  map={map}
                  tasks={tasks}
                  onMoveToRoom={movePlayer}
                  onUseVent={useVent}
                  onKillPlayer={killPlayer}
                  onReportBody={reportBody}
                  onTaskSelect={setSelectedTask}
                />
              </div>
            )}

            {/* Emergency Task */}
            {emergencyTask && (
              <div className="bg-gradient-to-br from-red-900/40 to-red-800/40 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border-2 border-red-500/50">
                <div className="flex items-center gap-3 mb-4">
                  <WarningAmberIcon sx={{ fontSize: 32, color: '#fbbf24' }} />
                  <h2 className="text-2xl font-black text-yellow-300">
                    EMERGENCY TASK
                  </h2>
                </div>
                <p className="mb-6 text-gray-200 text-lg">{emergencyTask.question}</p>

                <div className="space-y-3 mb-6">
                  {emergencyTask.options.map((option: string, index: number) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                        answer === option
                          ? "bg-gray-700 border-gray-500 shadow-lg"
                          : "bg-red-800/40 border-red-700/50 hover:bg-red-700/40 hover:border-red-600/50"
                      }`}
                      onClick={() => setAnswer(option)}
                    >
                      <span className="text-white font-medium">{option}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm">
                    {timeLeft !== null && timeLeft > 0 && (
                      <>
                        <TimerIcon sx={{ fontSize: 18, color: '#fbbf24' }} />
                        <span className="text-yellow-300 font-semibold">
                          Time left: {timeLeft} seconds
                        </span>
                      </>
                    )}
                    {timeLeft === 0 && (
                      <span className="text-red-300 font-semibold">
                        Time's up! Game over!
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleTaskSubmit}
                    disabled={!answer}
                    className={`py-3 px-6 rounded-xl font-bold text-white transition-all duration-200 ${
                      answer
                        ? "bg-gradient-to-r from-gray-700 to-slate-700 hover:from-gray-600 hover:to-slate-600 hover:scale-105 border border-gray-600/50"
                        : "bg-gray-700 cursor-not-allowed opacity-50 border border-gray-600/50"
                    }`}
                  >
                    Submit Emergency Task
                  </button>
                </div>
              </div>
            )}

            {/* Discussion/Voting Area */}
            {game.gameStatus === "discussion" && (
              <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <HowToVoteIcon sx={{ fontSize: 28 }} />
                  <h2 className="text-2xl font-bold text-white">Discussion</h2>
                </div>
                <p className="mb-6 text-gray-300">
                  A meeting has been called. Discuss with other players and vote to eject the impostor.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {players
                    .filter((p: any) => p.status === "alive")
                    .map((player: any) => (
                      <button
                        key={player.playerId}
                        onClick={() => vote(player.playerId)}
                        className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 hover:from-gray-700/80 hover:to-slate-700/80 p-5 rounded-xl text-left transition-all duration-200 border border-gray-700/50 hover:border-gray-600/70 hover:scale-105"
                      >
                        <div className="flex items-center gap-3">
                          <FiberManualRecordIcon sx={{ fontSize: 12, color: '#10b981' }} />
                          <span className="font-bold text-white">{player.name}</span>
                        </div>
                        <div className="text-sm text-gray-400 mt-2">
                          Click to vote
                        </div>
                      </button>
                    ))}
                  <button
                    onClick={() => vote("skip")}
                    className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 hover:from-gray-700/80 hover:to-slate-700/80 p-5 rounded-xl text-left transition-all duration-200 border border-gray-700/50 hover:border-gray-600/70 hover:scale-105"
                  >
                    <div className="flex items-center gap-3">
                      <FiberManualRecordIcon sx={{ fontSize: 12, color: '#6b7280' }} />
                      <span className="font-bold text-white">Skip Vote</span>
                    </div>
                    <div className="text-sm text-gray-400 mt-2">
                      Skip this round
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Game Over */}
            {game.gameStatus === "ended" && (
              <div className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 text-center border border-gray-700/50">
                <div className="flex justify-center mb-4">
                  <EmojiEventsIcon sx={{ fontSize: 64, color: '#fbbf24' }} />
                </div>
                <h2 className="text-3xl font-black mb-4 text-white">Game Over</h2>
                <p className="text-2xl mb-6 text-gray-300">
                  Winner:{" "}
                  <span className="font-black text-white">
                    {game.winner === "crewmates" ? "Crewmates" : "Other Team"}
                  </span>
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-700 to-slate-700 hover:from-gray-600 hover:to-slate-600 text-white py-3 px-8 rounded-xl font-bold transition-all duration-200 hover:scale-105 border border-gray-600/50"
                >
                  <ReplayIcon sx={{ fontSize: 22 }} />
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800/95 to-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-lg border border-gray-700/50">
            <h3 className="text-2xl font-bold mb-4 text-white">
              {selectedTask.description}
            </h3>
            <p className="mb-6 text-gray-300 text-lg">{selectedTask.question}</p>

            {/* Show task result if available */}
            {taskResult && (
              <div
                className={`mb-6 p-4 rounded-xl text-center font-semibold border-2 ${
                  taskResult.isCorrect
                    ? "bg-green-500/20 border-green-500/50 text-green-300"
                    : "bg-red-500/20 border-red-500/50 text-red-300"
                }`}
              >
                {taskResult.message}
              </div>
            )}

            <div className="space-y-3 mb-6">
              {selectedTask.options.map((option: string, index: number) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                    answer === option
                      ? "bg-gray-700 border-gray-500 shadow-lg"
                      : "bg-slate-700/50 border-gray-700/50 hover:bg-slate-600/50 hover:border-gray-600/50"
                  }`}
                  onClick={() => {
                    setAnswer(option);
                    setTaskResult(null);
                  }}
                >
                  <span className="text-white font-medium">{option}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              {!taskResult ? (
                <>
                  <button
                    onClick={() => {
                      setSelectedTask(null);
                      setTaskResult(null);
                      setAnswer("");
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 border border-gray-600/50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTaskSubmit}
                    disabled={!answer}
                    className={`py-3 px-6 rounded-xl font-bold text-white transition-all duration-200 ${
                      answer
                        ? "bg-gradient-to-r from-gray-700 to-slate-700 hover:from-gray-600 hover:to-slate-600 hover:scale-105 border border-gray-600/50"
                        : "bg-gray-700 cursor-not-allowed opacity-50 border border-gray-600/50"
                    }`}
                  >
                    Submit
                  </button>
                </>
              ) : taskResult.isCorrect ? (
                <button
                  onClick={() => {
                    setSelectedTask(null);
                    setTaskResult(null);
                    setAnswer("");
                  }}
                  className="bg-gradient-to-r from-gray-700 to-slate-700 hover:from-gray-600 hover:to-slate-600 text-white py-3 px-6 rounded-xl font-bold transition-all duration-200 hover:scale-105 border border-gray-600/50"
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setTaskResult(null);
                      setAnswer("");
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 border border-gray-600/50"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTask(null);
                      setTaskResult(null);
                      setAnswer("");
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 border border-gray-600/50"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default GamePage;
