import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useGameState } from "../hooks/useGameState";
import GameMap from "../components/GameMap";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading game...</div>
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

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Game not found</div>
      </div>
    );
  }

  // Check if player is impostor
  const isImpostor = currentPlayer?.role === "imposter";

  const handleTaskSubmit = async () => {
    if (!selectedTask || !answer) return;

    try {
      await submitTask(selectedTask.taskId, answer);
      setSelectedTask(null);
      setAnswer("");
    } catch (err) {
      console.error("Failed to submit task", err);
    }
  };

  const handleCallMeeting = async (reason: string) => {
    try {
      await callMeeting(reason);
      setShowMeetingButton(false);
      // Re-enable meeting button after 30 seconds
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
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Game Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-amongus-red">
            Among Us Coding Game
          </h1>
          <div className="text-right">
            <div className="text-sm text-gray-400">Game ID: {gameId}</div>
            <div className="text-sm">
              Status: <span className="font-bold">{game.gameStatus}</span>
            </div>
          </div>
        </div>

        {/* Game Status Bar */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-bold">Players: </span>
              <span>
                {players.filter((p: any) => p.status === "alive").length} alive,{" "}
              </span>
              <span>
                {players.filter((p: any) => p.status === "dead").length} dead
              </span>
            </div>
            <div>
              {game.currentSabotage && (
                <span className="bg-red-500 px-3 py-1 rounded-full text-sm">
                  Sabotage: {game.currentSabotage}
                </span>
              )}
              {timeLeft !== null && timeLeft > 0 && (
                <span className="ml-2 bg-yellow-500 px-3 py-1 rounded-full text-sm">
                  Time left: {timeLeft}s
                </span>
              )}
              {timeLeft === 0 && (
                <span className="ml-2 bg-red-500 px-3 py-1 rounded-full text-sm">
                  Time's up!
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player List */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-lg p-4">
              <h2 className="text-xl font-bold mb-4">Players</h2>
              <div className="space-y-2">
                {players.map((player: any) => (
                  <div
                    key={player.playerId}
                    className={`flex items-center justify-between p-3 rounded ${
                      player.status === "dead" ? "bg-red-900" : "bg-slate-700"
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full mr-2 ${
                          player.status === "alive"
                            ? "bg-amongus-green"
                            : "bg-gray-500"
                        }`}
                      ></div>
                      <span>{player.name}</span>
                      {player.role === "imposter" && (
                        <span className="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded">
                          Impostor
                        </span>
                      )}
                    </div>
                    {player.playerId === playerId && (
                      <span className="text-xs bg-amongus-blue text-white px-2 py-1 rounded">
                        You
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Impostor Actions */}
            {isImpostor && game.gameStatus === "in-progress" && (
              <div className="bg-slate-800 rounded-lg p-4 mt-6">
                <h2 className="text-xl font-bold mb-4">Sabotage</h2>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSabotage("lights")}
                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded text-sm"
                  >
                    Lights
                  </button>
                  <button
                    onClick={() => handleSabotage("reactor")}
                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded text-sm"
                  >
                    Reactor
                  </button>
                  <button
                    onClick={() => handleSabotage("oxygen")}
                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded text-sm"
                  >
                    Oxygen
                  </button>
                  <button
                    onClick={() => handleSabotage("communications")}
                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded text-sm"
                  >
                    Communications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Game Map */}
            {map && (
              <div className="bg-slate-800 rounded-lg p-4 mb-6">
                <GameMap
                  gameId={gameId!}
                  playerId={playerId}
                  playerRole={currentPlayer?.role || "crewmate"}
                  players={players}
                  map={map}
                  onMoveToRoom={movePlayer}
                  onUseVent={useVent}
                  onKillPlayer={killPlayer}
                  onReportBody={reportBody}
                />
              </div>
            )}

            {/* Emergency Task */}
            {emergencyTask && (
              <div className="bg-red-900 rounded-lg p-4 mb-6">
                <h2 className="text-xl font-bold mb-4 text-yellow-300">
                  EMERGENCY TASK
                </h2>
                <p className="mb-4">{emergencyTask.question}</p>

                <div className="space-y-2 mb-4">
                  {emergencyTask.options.map(
                    (option: string, index: number) => (
                      <div
                        key={index}
                        className={`p-3 rounded cursor-pointer ${
                          answer === option
                            ? "bg-amongus-blue"
                            : "bg-red-800 hover:bg-red-700"
                        }`}
                        onClick={() => setAnswer(option)}
                      >
                        {option}
                      </div>
                    )
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    {timeLeft !== null && timeLeft > 0 && (
                      <span>Time left: {timeLeft} seconds</span>
                    )}
                    {timeLeft === 0 && (
                      <span className="text-red-300">
                        Time's up! Impostors win!
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleTaskSubmit}
                    disabled={!answer}
                    className={`py-2 px-4 rounded text-white ${
                      answer
                        ? "bg-amongus-green hover:bg-green-600"
                        : "bg-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Submit Emergency Task
                  </button>
                </div>
              </div>
            )}

            {/* Tasks */}
            <div className="bg-slate-800 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Tasks</h2>
                {showMeetingButton && game.gameStatus === "in-progress" && (
                  <button
                    onClick={() => handleCallMeeting("emergency")}
                    className="bg-amongus-blue hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
                  >
                    Call Meeting
                  </button>
                )}
              </div>

              {tasks.filter((task: any) => !task.isEmergency).length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No tasks assigned
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tasks
                    .filter((task: any) => !task.isEmergency)
                    .map((task: any) => (
                      <div
                        key={task.taskId}
                        className={`p-4 rounded-lg cursor-pointer transition duration-200 ${
                          task.status === "completed"
                            ? "bg-green-900"
                            : task.status === "failed"
                            ? "bg-red-900"
                            : "bg-slate-700 hover:bg-slate-600"
                        }`}
                        onClick={() =>
                          task.status === "pending" && setSelectedTask(task)
                        }
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold">{task.description}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              task.status === "completed"
                                ? "bg-green-500"
                                : task.status === "failed"
                                ? "bg-red-500"
                                : "bg-gray-500"
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {task.category} • {task.difficulty}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Task Modal */}
            {selectedTask && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold mb-4">
                    {selectedTask.description}
                  </h3>
                  <p className="mb-4">{selectedTask.question}</p>

                  <div className="space-y-2 mb-4">
                    {selectedTask.options.map(
                      (option: string, index: number) => (
                        <div
                          key={index}
                          className={`p-3 rounded cursor-pointer ${
                            answer === option
                              ? "bg-amongus-blue"
                              : "bg-slate-700 hover:bg-slate-600"
                          }`}
                          onClick={() => setAnswer(option)}
                        >
                          {option}
                        </div>
                      )
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setSelectedTask(null)}
                      className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleTaskSubmit}
                      disabled={!answer}
                      className={`py-2 px-4 rounded text-white ${
                        answer
                          ? "bg-amongus-green hover:bg-green-600"
                          : "bg-gray-500 cursor-not-allowed"
                      }`}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Discussion/Voting Area */}
            {game.gameStatus === "discussion" && (
              <div className="bg-slate-800 rounded-lg p-4">
                <h2 className="text-xl font-bold mb-4">Discussion</h2>
                <p className="mb-4">
                  A meeting has been called. Discuss with other players and vote
                  to eject the impostor.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {players
                    .filter((p: any) => p.status === "alive")
                    .map((player: any) => (
                      <button
                        key={player.playerId}
                        onClick={() => vote(player.playerId)}
                        className="bg-slate-700 hover:bg-slate-600 p-4 rounded-lg text-left"
                      >
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-amongus-green mr-2"></div>
                          <span>{player.name}</span>
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          Click to vote
                        </div>
                      </button>
                    ))}
                  <button
                    onClick={() => vote("skip")}
                    className="bg-slate-700 hover:bg-slate-600 p-4 rounded-lg text-left"
                  >
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                      <span>Skip Vote</span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Skip this round
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Game Over */}
            {game.gameStatus === "ended" && (
              <div className="bg-slate-800 rounded-lg p-6 text-center">
                <h2 className="text-2xl font-bold mb-4">Game Over</h2>
                <p className="text-xl mb-4">
                  Winner:{" "}
                  <span className="font-bold text-amongus-green">
                    {game.winner === "crewmates" ? "Crewmates" : "Impostors"}
                  </span>
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-amongus-blue hover:bg-blue-600 text-white py-2 px-6 rounded"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
