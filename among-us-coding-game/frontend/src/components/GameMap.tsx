import React, { useState, useEffect, useRef } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface Room {
  name: string;
  displayName: string;
  adjacentRooms: string[];
  ventsTo: string[];
  tasks: string[];
  coordinates: number[];
  center: { x: number; y: number };
}

interface Player {
  playerId: string;
  name: string;
  role: "crewmate" | "imposter" | "ghost";
  status: "alive" | "dead" | "disconnected";
  currentRoom: string;
  isVenting: boolean;
  tasks?: string[]; // Add tasks property as optional
}

interface GameMapProps {
  gameId: string;
  playerId: string;
  playerRole: "crewmate" | "imposter" | "ghost";
  players: Player[];
  map: Room[];
  tasks: any[]; // Add tasks prop
  onMoveToRoom: (roomName: string) => void;
  onUseVent: (targetRoom: string) => void;
  onKillPlayer: (targetId: string) => void;
  onReportBody: (deadPlayerId: string) => void;
  onTaskSelect?: (task: any) => void; // Add task selection handler
}

const ROOM_DEFINITIONS: Record<
  string,
  {
    coordinates: number[];
    center: { x: number; y: number };
    displayName: string;
  }
> = {
  cafeteria: {
    coordinates: [
      900, 507, 795, 406, 791, 122, 873, 36, 1132, 39, 1252, 160, 1259, 395,
      1147, 507,
    ],
    center: { x: 1020, y: 300 },
    displayName: "Cafeteria",
  },
  weapons: {
    coordinates: [
      1334, 140, 1337, 313, 1385, 357, 1530, 359, 1535, 228, 1442, 138,
    ],
    center: { x: 1435, y: 250 },
    displayName: "Weapons",
  },
  navigation: {
    coordinates: [
      1690, 409, 1686, 590, 1769, 597, 1839, 543, 1835, 458, 1767, 400,
    ],
    center: { x: 1760, y: 500 },
    displayName: "Navigation",
  },
  o2: {
    coordinates: [1279, 384, 1369, 392, 1373, 529, 1217, 528, 1212, 467],
    center: { x: 1290, y: 460 },
    displayName: "O2",
  },
  admin: {
    coordinates: [1334, 559, 1334, 706, 1300, 742, 1129, 745, 1135, 559],
    center: { x: 1230, y: 650 },
    displayName: "Admin",
  },
  storage: {
    coordinates: [
      900, 660, 839, 724, 837, 956, 922, 1039, 1093, 1044, 1093, 660,
    ],
    center: { x: 970, y: 850 },
    displayName: "Storage",
  },
  electrical: {
    coordinates: [
      625, 605, 622, 832, 742, 834, 788, 787, 786, 719, 837, 656, 834, 605,
    ],
    center: { x: 730, y: 720 },
    displayName: "Electrical",
  },
  lower_engine: {
    coordinates: [244, 681, 244, 859, 300, 895, 437, 893, 439, 680],
    center: { x: 340, y: 780 },
    displayName: "Lower Engine",
  },
  reactor: {
    coordinates: [
      158, 354, 80, 403, 80, 647, 147, 691, 203, 689, 203, 627, 261, 622, 263,
      430, 200, 423, 195, 359,
    ],
    center: { x: 170, y: 520 },
    displayName: "Reactor",
  },
  upper_engine: {
    coordinates: [297, 164, 242, 213, 246, 385, 442, 388, 439, 164],
    center: { x: 340, y: 270 },
    displayName: "Upper Engine",
  },
  security: {
    coordinates: [491, 398, 452, 432, 454, 620, 561, 618, 564, 430, 527, 398],
    center: { x: 510, y: 510 },
    displayName: "Security",
  },
  medbay: {
    coordinates: [
      588, 329, 588, 516, 627, 562, 842, 560, 839, 506, 766, 431, 764, 328,
    ],
    center: { x: 710, y: 430 },
    displayName: "Medbay",
  },
  communications: {
    coordinates: [
      1110, 879, 1110, 1001, 1151, 1044, 1276, 1040, 1322, 995, 1320, 878,
    ],
    center: { x: 1220, y: 960 },
    displayName: "Communication",
  },
  shields: {
    coordinates: [
      1337, 772, 1337, 935, 1442, 931, 1529, 846, 1530, 716, 1383, 716,
    ],
    center: { x: 1430, y: 830 },
    displayName: "Shields",
  },
};

const GameMap: React.FC<GameMapProps> = ({
  gameId,
  playerId,
  playerRole,
  players,
  map,
  tasks,
  onMoveToRoom,
  onUseVent,
  onKillPlayer,
  onReportBody,
  onTaskSelect, // Add task selection handler
}) => {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [playersInRoom, setPlayersInRoom] = useState<Player[]>([]);
  const [canKill, setCanKill] = useState(false);
  const [canReport, setCanReport] = useState(false);
  const [deadPlayersInRoom, setDeadPlayersInRoom] = useState<Player[]>([]);
  const [ventCooldown, setVentCooldown] = useState(0);
  const [killCooldown, setKillCooldown] = useState(0);
  const [imageMap, setImageMap] = useState<Room[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visitedRooms, setVisitedRooms] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (map.length === 0) return;

    const imageMapRooms: Room[] = map.map((room) => {
      const definition = ROOM_DEFINITIONS[room.name];
      if (definition) {
        return {
          ...room,
          coordinates: definition.coordinates,
          center: definition.center,
          displayName: definition.displayName,
        };
      }
      return {
        ...room,
        coordinates: [],
        center: { x: 0, y: 0 },
        displayName: room.name,
      };
    });

    setImageMap(imageMapRooms);
  }, [map]);

  useEffect(() => {
    const player = players.find((p) => p.playerId === playerId);
    setCurrentPlayer(player || null);

    if (player && selectedRoom) {
      if (player.role === "imposter" && player.status === "alive") {
        const playersInSameRoom = players.filter(
          (p) =>
            p.currentRoom === selectedRoom &&
            p.playerId !== playerId &&
            p.status === "alive"
        );
        setCanKill(playersInSameRoom.length > 0);
      }

      if (player.role === "crewmate" && player.status === "alive") {
        const deadPlayers = players.filter(
          (p) => p.currentRoom === selectedRoom && p.status === "dead"
        );
        setDeadPlayersInRoom(deadPlayers);
        setCanReport(deadPlayers.length > 0);
      }
    }
  }, [players, playerId, selectedRoom]);

  useEffect(() => {
    if (selectedRoom) {
      const playersInSelectedRoom = players.filter(
        (player) => player.currentRoom === selectedRoom
      );
      setPlayersInRoom(playersInSelectedRoom);
    }
  }, [players, selectedRoom]);

  const handleRoomClick = (roomName: string) => {
    setSelectedRoom(roomName);
  };

  const handleUseVent = () => {
    if (selectedRoom && currentPlayer) {
      const currentRoom = imageMap.find((r) => r.name === selectedRoom);
      if (currentRoom && currentRoom.ventsTo.length > 0) {
        onUseVent(currentRoom.ventsTo[0]);
      }
    }
  };

  const handleKill = (targetId: string) => {
    onKillPlayer(targetId);
  };

  const handleReportBody = (deadPlayerId: string) => {
    onReportBody(deadPlayerId);
  };

  // Track when player enters a new room with tasks
  useEffect(() => {
    if (currentPlayer && currentPlayer.currentRoom) {
      const roomName = currentPlayer.currentRoom;

      // If player hasn't visited this room before and it has tasks, show notification
      if (!visitedRooms.has(roomName)) {
        const roomTasks = getTasksForRoom(roomName);
        if (roomTasks.length > 0) {
          // Add room to visited rooms
          setVisitedRooms((prev) => new Set(prev).add(roomName));

          // Show notification (in a real app, this would be a toast notification)
          console.log(
            `You have ${roomTasks.length} task${
              roomTasks.length > 1 ? "s" : ""
            } in this room!`
          );
        }
      }
    }
  }, [currentPlayer, visitedRooms, tasks, imageMap]);

  // Get tasks for a specific room
  const getTasksForRoom = (roomName: string) => {
    if (!currentPlayer) return [];

    // Get player's task IDs
    const playerTaskIds = currentPlayer.tasks || [];

    // Find the room in the map
    const room = imageMap.find((r) => r.name === roomName);
    if (!room) return [];

    // Filter tasks that are assigned to this player and belong to this room
    // For impostors, only show fake tasks
    // For crewmates, only show real tasks
    return tasks.filter(
      (task) =>
        playerTaskIds.includes(task.taskId) &&
        task.status === "pending" &&
        room.tasks?.includes(task.taskId) &&
        (currentPlayer.role === "imposter"
          ? task.description.includes("Fake Task")
          : !task.description.includes("Fake Task"))
    );
  };

  // Render task indicators on the map
  const renderTaskIndicators = () => {
    return imageMap.map((room) => {
      const roomTasks = getTasksForRoom(room.name);
      if (roomTasks.length === 0) return null;

      // Position task indicator at a slightly offset position from room center
      const indicatorX = room.center.x + 15;
      const indicatorY = room.center.y - 15;

      return (
        <g key={`tasks-${room.name}`}>
          <circle
            cx={indicatorX}
            cy={indicatorY}
            r="12"
            fill="#f59e0b"
            stroke="#d97706"
            strokeWidth="2"
            style={{ pointerEvents: "none" }}
          />
          <text
            x={indicatorX}
            y={indicatorY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="12"
            fontWeight="bold"
            style={{ pointerEvents: "none" }}
          >
            {roomTasks.length}
          </text>
          <title>
            {roomTasks.length} task{roomTasks.length > 1 ? "s" : ""} available
          </title>
        </g>
      );
    });
  };

  // Render player on map
  const renderPlayerOnMap = (player: Player) => {
    const room = imageMap.find((r) => r.name === player.currentRoom);
    if (!room) return null;

    // Position player name at the center of the room
    const playerX = room.center.x;
    const playerY = room.center.y;
    const isMe = player.playerId === playerId;
    const size = 1;

    return (
      <g key={player.playerId}>
        <title>{`${player.name} (${player.role})`}</title>

        {isMe && (
          <polygon
            points={`${playerX},${playerY - 25 * size} ${playerX - 12 * size},${
              playerY - 5 * size
            } ${playerX + 12 * size},${playerY - 5 * size}`}
            fill={
              player.role === "imposter"
                ? "#ef4444"
                : player.role === "crewmate"
                ? "#fbbf24"
                : "#6b7280"
            }
            stroke="#ffffff"
            strokeWidth="5"
            pointerEvents="none"
          />
        )}

        <text
          x={playerX}
          y={playerY}
          textAnchor="middle"
          fill={
            player.role === "imposter"
              ? "#ef4444"
              : player.role === "crewmate"
              ? "#3b82f6"
              : "#6b7280"
          }
          stroke="#ffffff"
          strokeWidth="1"
          fontSize="14"
          fontWeight="bold"
          pointerEvents="none"
        >
          {player.name}
        </text>

        {player.status === "dead" && (
          <text
            x={playerX}
            y={playerY + 15}
            textAnchor="middle"
            fill="#9ca3af"
            fontSize="10"
            pointerEvents="none"
          >
            (DEAD)
          </text>
        )}
        {player.isVenting && (
          <text
            x={playerX}
            y={playerY + 30}
            textAnchor="middle"
            fill="#a855f7"
            fontSize="10"
            pointerEvents="none"
          >
            (VENTING)
          </text>
        )}
      </g>
    );
  };

  const getAdjacentRooms = () => {
    if (
      !currentPlayer ||
      !selectedRoom ||
      currentPlayer.currentRoom !== selectedRoom
    ) {
      return [];
    }

    const currentRoom = imageMap.find((r) => r.name === selectedRoom);
    if (!currentRoom) {
      return [];
    }

    return currentRoom.adjacentRooms
      .map((roomName: string) =>
        imageMap.find((r: Room) => r.name === roomName)
      )
      .filter((room): room is Room => room !== undefined);
  };

  const getDirection = (fromRoom: Room, toRoom: Room) => {
    const dx = toRoom.center.x - fromRoom.center.x;
    const dy = toRoom.center.y - fromRoom.center.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? "right" : "left";
    } else {
      return dy > 0 ? "down" : "up";
    }
  };

  const renderMovementArrows = () => {
    if (
      !selectedRoom ||
      !currentPlayer ||
      currentPlayer.currentRoom !== selectedRoom ||
      currentPlayer.status !== "alive"
    ) {
      return null;
    }

    const currentRoom = imageMap.find((r) => r.name === selectedRoom);
    if (!currentRoom) return null;

    const adjacentRooms = getAdjacentRooms();
    if (adjacentRooms.length === 0) return null;

    return adjacentRooms.map((room) => {
      const direction = getDirection(currentRoom, room);
      const arrowX = (currentRoom.center.x + room.center.x) / 2;
      const arrowY = (currentRoom.center.y + room.center.y) / 2;

      return (
        <g
          key={`arrow-${room.name}`}
          onClick={() => onMoveToRoom(room.name)}
          className="cursor-pointer"
          style={{ pointerEvents: "all" }}
        >
          <circle
            cx={arrowX}
            cy={arrowY}
            r="50"
            fill="#3b82f6"
            stroke="#1d4ed8"
            strokeWidth="2"
          />
          <text
            x={arrowX}
            y={arrowY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="50"
            fontWeight="bold"
            pointerEvents="none"
          >
            {direction === "up"
              ? "↑"
              : direction === "down"
              ? "↓"
              : direction === "left"
              ? "←"
              : "→"}
          </text>
          <title>Move to {room.displayName}</title>
        </g>
      );
    });
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4">Ship Map</h2>

      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={3}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
        panning={{ disabled: false }}
        doubleClick={{ disabled: false }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Zoom Controls */}
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => zoomIn()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                  ></path>
                </svg>
                Zoom In
              </button>
              <button
                onClick={() => zoomOut()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                  ></path>
                </svg>
                Zoom Out
              </button>
              <button
                onClick={() => resetTransform()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  ></path>
                </svg>
                Reset
              </button>
            </div>

            <TransformComponent
              wrapperStyle={{
                width: "100%",
                height: "800px",
                maxHeight: "calc(100vh - 200px)",
              }}
              contentStyle={{
                width: "100%",
                height: "100%",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                }}
              >
                {/* Among Us Map Image */}
                <img
                  src="/images/map.png"
                  alt="Among Us Map"
                  className="absolute top-0 left-0 w-full h-full object-contain"
                  style={{ zIndex: 1, pointerEvents: "none" }}
                />

                {/* SVG overlay for highlights, players, and interactive elements */}
                <svg
                  className="absolute top-0 left-0 w-full h-full"
                  viewBox="0 0 1920 1080"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ zIndex: 2, pointerEvents: "none" }}
                >
                  {/* Clickable room areas */}
                  {imageMap.map((room) => (
                    <polygon
                      key={`area-${room.name}`}
                      points={room.coordinates.join(",")}
                      fill="transparent"
                      stroke="transparent"
                      strokeWidth="0"
                      onClick={() => handleRoomClick(room.name)}
                      style={{
                        pointerEvents: "all",
                        cursor: "pointer",
                      }}
                    />
                  ))}

                  {/* Highlight current player's room */}
                  {currentPlayer &&
                    currentPlayer.currentRoom &&
                    ROOM_DEFINITIONS[currentPlayer.currentRoom] && (
                      <polygon
                        points={ROOM_DEFINITIONS[
                          currentPlayer.currentRoom
                        ].coordinates.join(",")}
                        fill="rgba(59, 130, 246, 0.3)"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeDasharray="5,5"
                        style={{ pointerEvents: "none" }}
                      />
                    )}

                  {/* Highlight selected room */}
                  {selectedRoom &&
                    selectedRoom !== currentPlayer?.currentRoom &&
                    ROOM_DEFINITIONS[selectedRoom] && (
                      <polygon
                        points={ROOM_DEFINITIONS[selectedRoom].coordinates.join(
                          ","
                        )}
                        fill="rgba(34, 197, 94, 0.2)"
                        stroke="#22c55e"
                        strokeWidth="3"
                        style={{ pointerEvents: "none" }}
                      />
                    )}

                  {/* Task indicators */}
                  {renderTaskIndicators()}

                  {/* Players */}
                  {players.map(renderPlayerOnMap)}

                  {/* Movement arrows */}
                  {renderMovementArrows()}
                </svg>
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {/* Room details panel */}
      {selectedRoom && (
        <div className="bg-slate-700 rounded-lg p-4 mt-4">
          <h3 className="text-lg font-bold mb-2">
            {imageMap.find((r) => r.name === selectedRoom)?.displayName}
          </h3>

          {/* Task information when player is in the room */}
          {currentPlayer && currentPlayer.currentRoom === selectedRoom && (
            <div className="mb-4">
              <h4 className="font-bold mb-2">Tasks in this Room:</h4>
              {getTasksForRoom(selectedRoom).length > 0 ? (
                <div className="space-y-2">
                  {getTasksForRoom(selectedRoom).map((task) => (
                    <div
                      key={task.taskId}
                      className={`p-3 rounded cursor-pointer hover:bg-amber-800 transition-colors ${
                        currentPlayer.role === "imposter" &&
                        task.description.includes("Fake Task")
                          ? "bg-amber-900"
                          : currentPlayer.role === "crewmate" &&
                            !task.description.includes("Fake Task")
                          ? "bg-amber-900"
                          : "bg-gray-700 cursor-not-allowed"
                      }`}
                      onClick={() => {
                        // Only allow crewmates to select real tasks
                        // Only allow impostors to select fake tasks
                        const isCrewmateRealTask =
                          currentPlayer.role === "crewmate" &&
                          !task.description.includes("Fake Task");
                        const isImpostorFakeTask =
                          currentPlayer.role === "imposter" &&
                          task.description.includes("Fake Task");

                        if (
                          (isCrewmateRealTask || isImpostorFakeTask) &&
                          onTaskSelect
                        ) {
                          onTaskSelect(task);
                        } else if (isCrewmateRealTask || isImpostorFakeTask) {
                          alert(`Task: ${task.description}

Question: ${task.question}

Click 'OK' to answer this task.`);
                        } else if (
                          currentPlayer.role === "imposter" &&
                          !task.description.includes("Fake Task")
                        ) {
                          // Impostor trying to access real task
                          alert(
                            "You cannot complete real tasks as an impostor!"
                          );
                        } else if (
                          currentPlayer.role === "crewmate" &&
                          task.description.includes("Fake Task")
                        ) {
                          // Crewmate trying to access fake task
                          alert("This is a fake task for impostors only!");
                        }
                      }}
                    >
                      <div className="font-medium">{task.description}</div>
                      <div className="text-sm text-amber-200">
                        {task.category} • {task.difficulty}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No tasks available in this room</p>
              )}
            </div>
          )}

          {/* Players in room */}
          <div className="mb-4">
            <h4 className="font-bold mb-2">Players in Room:</h4>
            {playersInRoom.length > 0 ? (
              playersInRoom.map((player) => {
                const isMe = player.playerId === playerId;
                return (
                  <div
                    key={player.playerId}
                    className={`p-2 rounded mb-2 flex items-center ${
                      player.status === "dead"
                        ? "bg-red-900"
                        : player.role === "imposter"
                        ? "bg-red-700"
                        : "bg-blue-700"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${
                        player.status === "alive"
                          ? "bg-green-400"
                          : "bg-gray-400"
                      }`}
                    ></div>
                    <span className={isMe ? "font-bold" : ""}>
                      {player.name} {isMe && "(You)"}
                    </span>
                    {player.isVenting && (
                      <span className="ml-2 text-xs bg-purple-500 px-1 rounded">
                        VENTING
                      </span>
                    )}
                    {player.status === "dead" && (
                      <span className="ml-2 text-xs bg-gray-500 px-1 rounded">
                        DEAD
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-gray-400">No players in this room</p>
            )}
          </div>

          {currentPlayer && currentPlayer.status === "alive" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentPlayer.role === "imposter" && (
                <button
                  onClick={handleUseVent}
                  disabled={ventCooldown > 0}
                  className={`py-2 px-3 rounded text-sm flex items-center justify-center ${
                    ventCooldown > 0
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  }`}
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    ></path>
                  </svg>
                  {ventCooldown > 0 ? `Vent (${ventCooldown}s)` : "Use Vent"}
                </button>
              )}

              {canKill && currentPlayer.role === "imposter" && (
                <button
                  onClick={() => {
                    const target = playersInRoom.find(
                      (p) => p.playerId !== playerId && p.status === "alive"
                    );
                    if (target) {
                      handleKill(target.playerId);
                    }
                  }}
                  disabled={killCooldown > 0}
                  className={`py-2 px-3 rounded text-sm flex items-center justify-center ${
                    killCooldown > 0
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    ></path>
                  </svg>
                  {killCooldown > 0 ? `Kill (${killCooldown}s)` : "Kill Player"}
                </button>
              )}

              {canReport && currentPlayer.role === "crewmate" && (
                <button
                  onClick={() => {
                    if (deadPlayersInRoom.length > 0) {
                      handleReportBody(deadPlayersInRoom[0].playerId);
                    }
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded text-sm flex items-center justify-center"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    ></path>
                  </svg>
                  Report Body
                </button>
              )}
            </div>
          )}

          {deadPlayersInRoom.length > 0 && (
            <div className="mt-4">
              <h4 className="font-bold mb-2">Dead Players:</h4>
              {deadPlayersInRoom.map((player) => (
                <div
                  key={player.playerId}
                  className="bg-red-900 p-2 rounded mb-2"
                >
                  <span>{player.name}</span>
                  <button
                    onClick={() => handleReportBody(player.playerId)}
                    className="ml-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs py-1 px-2 rounded"
                  >
                    Report
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameMap;
