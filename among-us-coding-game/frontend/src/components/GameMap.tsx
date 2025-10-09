import React, { useState, useEffect, useRef } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import AssignmentIcon from "@mui/icons-material/Assignment";

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
  tasks?: string[];
}

interface GameMapProps {
  gameId: string;
  playerId: string;
  playerRole: "crewmate" | "imposter" | "ghost";
  players: Player[];
  map: Room[];
  tasks: any[];
  onMoveToRoom: (roomName: string) => void;
  onUseVent: (targetRoom: string) => void;
  onKillPlayer: (targetId: string) => void;
  onReportBody: (deadPlayerId: string) => void;
  onTaskSelect?: (task: any) => void;
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
  onTaskSelect,
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

  useEffect(() => {
    if (currentPlayer && currentPlayer.currentRoom) {
      const roomName = currentPlayer.currentRoom;

      if (!visitedRooms.has(roomName)) {
        const roomTasks = getTasksForRoom(roomName);
        if (roomTasks.length > 0) {
          setVisitedRooms((prev) => new Set(prev).add(roomName));
          console.log(
            `You have ${roomTasks.length} task${
              roomTasks.length > 1 ? "s" : ""
            } in this room!`
          );
        }
      }
    }
  }, [currentPlayer, visitedRooms, tasks, imageMap]);

  const getTasksForRoom = (roomName: string) => {
    const room = map?.find((r: any) => r.name === roomName);
    if (!room || !room.tasks) return [];

    const playerTaskIds = currentPlayer?.tasks || [];

    return tasks.filter(
      (task: any) =>
        playerTaskIds.includes(task.taskId) &&
        room.tasks?.includes(task.taskId) &&
        currentPlayer?.playerId === task.assignedTo
    );
  };

  // Enhanced task indicators with larger size and better visibility
  // Enhanced task indicators with color change based on completion status
  const renderTaskIndicators = () => {
    return imageMap.map((room) => {
      const roomTasks = getTasksForRoom(room.name);
      if (roomTasks.length === 0) return null;

      const pendingTasks = roomTasks.filter(
        (task) => task.status === "pending"
      ).length;
      const completedTasks = roomTasks.filter(
        (task) => task.status === "completed"
      ).length;
      const failedTasks = roomTasks.filter(
        (task) => task.status === "failed"
      ).length;

      // Check if all tasks are completed
      const allTasksCompleted =
        roomTasks.length > 0 && completedTasks === roomTasks.length;

      // Determine indicator color based on task status
      const indicatorColor = allTasksCompleted ? "#10b981" : "#f59e0b"; // Green if all completed, yellow otherwise
      const glowColor = allTasksCompleted
        ? "rgba(16, 185, 129, 0.3)"
        : "rgba(245, 158, 11, 0.3)";
      const strokeColor = allTasksCompleted ? "#059669" : "#ffffff";

      const indicatorX = room.center.x + 40;
      const indicatorY = room.center.y - 40;

      return (
        <g key={`tasks-${room.name}`}>
          {/* Glow effect for better visibility */}
          <circle
            cx={indicatorX}
            cy={indicatorY}
            r="35"
            fill={glowColor}
            style={{ pointerEvents: "none" }}
          />
          <circle
            cx={indicatorX}
            cy={indicatorY}
            r="28"
            fill={indicatorColor}
            stroke={strokeColor}
            strokeWidth="4"
            style={{ pointerEvents: "none" }}
          />

          {/* Show checkmark if all tasks completed, otherwise show count */}
          {allTasksCompleted ? (
            <text
              x={indicatorX}
              y={indicatorY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="24"
              fontWeight="bold"
              style={{ pointerEvents: "none" }}
            >
              ✓
            </text>
          ) : (
            <text
              x={indicatorX}
              y={indicatorY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="24"
              fontWeight="bold"
              style={{ pointerEvents: "none" }}
            >
              {roomTasks.length}
            </text>
          )}

          <title>
            {allTasksCompleted
              ? `All ${roomTasks.length} task${
                  roomTasks.length > 1 ? "s" : ""
                } completed!`
              : `${roomTasks.length} task${
                  roomTasks.length > 1 ? "s" : ""
                } available
${pendingTasks > 0 ? ` (${pendingTasks} pending)` : ""}${
                  completedTasks > 0 ? ` (${completedTasks} completed)` : ""
                }${failedTasks > 0 ? ` (${failedTasks} failed)` : ""}`}
          </title>
        </g>
      );
    });
  };

  // Enhanced player rendering with larger names and clearer position indicators
  const renderPlayerOnMap = (player: Player) => {
    const room = imageMap.find((r) => r.name === player.currentRoom);
    if (!room) return null;

    // Calculate player positions to avoid overlap
    const playersInSameRoom = players.filter(
      (p) => p.currentRoom === player.currentRoom
    );
    const playerIndex = playersInSameRoom.findIndex(
      (p) => p.playerId === player.playerId
    );
    const totalPlayers = playersInSameRoom.length;

    // Offset players in the same room
    const offsetX =
      totalPlayers > 1 ? (playerIndex - (totalPlayers - 1) / 2) * 80 : 0;
    const offsetY = totalPlayers > 2 ? Math.floor(playerIndex / 3) * 50 : 0;

    const playerX = room.center.x + offsetX;
    const playerY = room.center.y + offsetY;
    const isMe = player.playerId === playerId;

    return (
      <g key={player.playerId}>
        <title>{`${player.name} (${player.role})`}</title>

        {/* Player position indicator - larger and more visible */}
        {isMe && (
          <>
            {/* Pulsing glow for current player */}
            <circle
              cx={playerX}
              cy={playerY}
              r="55"
              fill="rgba(251, 191, 36, 0.2)"
              style={{ pointerEvents: "none" }}
            >
              <animate
                attributeName="r"
                values="55;65;55"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.2;0.4;0.2"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Large arrow pointing down at player */}
            <polygon
              points={`${playerX},${playerY - 60} ${playerX - 25},${
                playerY - 25
              } ${playerX + 25},${playerY - 25}`}
              fill="#fbbf24"
              stroke="#ffffff"
              strokeWidth="5"
              pointerEvents="none"
            />
          </>
        )}

        {/* Player background circle for better text readability */}
        <circle
          cx={playerX}
          cy={playerY}
          r="40"
          fill={
            player.status === "dead"
              ? "#6b7280"
              : player.role === "imposter"
              ? "#ef4444"
              : "#3b82f6"
          }
          stroke="#ffffff"
          strokeWidth="4"
          opacity="0.9"
          pointerEvents="none"
        />

        {/* Player name - larger and more readable */}
        <text
          x={playerX}
          y={playerY - 50}
          textAnchor="middle"
          fill="#ffffff"
          stroke={player.status === "dead" ? "#6b7280" : "#000000"}
          strokeWidth="3"
          fontSize="22"
          fontWeight="bold"
          pointerEvents="none"
          paintOrder="stroke"
        >
          {player.name}
        </text>

        {/* Player initials in circle */}
        <text
          x={playerX}
          y={playerY + 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#ffffff"
          fontSize="28"
          fontWeight="bold"
          pointerEvents="none"
        >
          {player.name.substring(0, 2).toUpperCase()}
        </text>

        {/* Status badges - larger and more visible */}
        {player.status === "dead" && (
          <g>
            <rect
              x={playerX - 35}
              y={playerY + 50}
              width="70"
              height="28"
              rx="14"
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth="3"
              pointerEvents="none"
            />
            <text
              x={playerX}
              y={playerY + 65}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize="14"
              fontWeight="bold"
              pointerEvents="none"
            >
              DEAD
            </text>
          </g>
        )}

        {player.isVenting && (
          <g>
            <rect
              x={playerX - 50}
              y={playerY + 50}
              width="100"
              height="28"
              rx="14"
              fill="#a855f7"
              stroke="#ffffff"
              strokeWidth="3"
              pointerEvents="none"
            />
            <text
              x={playerX}
              y={playerY + 65}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize="14"
              fontWeight="bold"
              pointerEvents="none"
            >
              VENTING
            </text>
          </g>
        )}
      </g>
    );
  };

  const getAdjacentRooms = () => {
    if (
      !currentPlayer ||
      !currentPlayer.currentRoom ||
      currentPlayer.status !== "alive"
    ) {
      return [];
    }

    const currentRoom = imageMap.find(
      (r) => r.name === currentPlayer.currentRoom
    );
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

  // Enhanced movement arrows - larger and more visible
  const renderMovementArrows = () => {
    if (
      !currentPlayer ||
      !currentPlayer.currentRoom ||
      currentPlayer.status !== "alive"
    ) {
      return null;
    }

    const currentRoom = imageMap.find(
      (r) => r.name === currentPlayer.currentRoom
    );
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
          {/* Glow effect */}
          <circle cx={arrowX} cy={arrowY} r="85" fill="rgba(59, 130, 246, 0.3)">
            <animate
              attributeName="r"
              values="85;95;85"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Main circle */}
          <circle
            cx={arrowX}
            cy={arrowY}
            r="40"
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth="5"
          />

          {/* Arrow symbol */}
          <text
            x={arrowX}
            y={arrowY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="70"
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

          {/* Room name label */}
          <rect
            x={arrowX - 60}
            y={arrowY + 85}
            width="120"
            height="30"
            rx="15"
            fill="rgba(0, 0, 0, 0.8)"
            stroke="#ffffff"
            strokeWidth="2"
            pointerEvents="none"
          />
          <text
            x={arrowX}
            y={arrowY + 100}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="14"
            fontWeight="bold"
            pointerEvents="none"
          >
            {room.displayName}
          </text>

          <title>Move to {room.displayName}</title>
        </g>
      );
    });
  };

  // Get players in current room (used for always-visible player list)
  const getPlayersInCurrentRoom = () => {
    if (!currentPlayer || !currentPlayer.currentRoom) {
      return [];
    }

    return players.filter(
      (player) => player.currentRoom === currentPlayer.currentRoom
    );
  };

  return (
    <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-700/50">
      <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-3">
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          ></path>
        </svg>
        Ship Map
      </h2>

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
            {/* Enhanced Zoom Controls */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => zoomIn()}
                className="flex items-center gap-2 bg-gradient-to-r from-gray-700 to-slate-700 hover:from-gray-600 hover:to-slate-600 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-200 border border-gray-600/50 hover:scale-105"
              >
                <ZoomInIcon sx={{ fontSize: 20 }} />
                Zoom In
              </button>
              <button
                onClick={() => zoomOut()}
                className="flex items-center gap-2 bg-gradient-to-r from-gray-700 to-slate-700 hover:from-gray-600 hover:to-slate-600 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-200 border border-gray-600/50 hover:scale-105"
              >
                <ZoomOutIcon sx={{ fontSize: 20 }} />
                Zoom Out
              </button>
              <button
                onClick={() => resetTransform()}
                className="flex items-center gap-2 bg-gray-800/60 hover:bg-gray-700/60 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-200 border border-gray-700/50 hover:scale-105"
              >
                <RestartAltIcon sx={{ fontSize: 20 }} />
                Reset
              </button>
            </div>

            <TransformComponent
              wrapperStyle={{
                width: "100%",
                height: "800px",
                maxHeight: "calc(100vh - 200px)",
                borderRadius: "1rem",
                overflow: "hidden",
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

                {/* SVG overlay */}
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
                        strokeWidth="5"
                        strokeDasharray="10,5"
                        style={{ pointerEvents: "none" }}
                      >
                        <animate
                          attributeName="stroke-opacity"
                          values="1;0.5;1"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </polygon>
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
                        strokeWidth="5"
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

      {/* Always show players in current room without requiring click */}
      {currentPlayer && currentPlayer.currentRoom && (
        <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 rounded-xl p-6 mt-6 border border-gray-700/50">
          <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
            <AssignmentIcon sx={{ fontSize: 24 }} />
            {
              imageMap.find((r) => r.name === currentPlayer.currentRoom)
                ?.displayName
            }{" "}
            - Players
          </h3>

          {/* Task information for current room */}
          <div className="mb-6">
            <h4 className="font-bold mb-3 text-gray-300 uppercase tracking-wider text-sm">
              Tasks in this Room:
            </h4>
            {getTasksForRoom(currentPlayer.currentRoom).length > 0 ? (
              <div className="space-y-3">
                {getTasksForRoom(currentPlayer.currentRoom).map((task) => (
                  <div
                    key={task.taskId}
                    className={`p-4 rounded-xl cursor-pointer hover:scale-105 transition-all duration-200 border-2 ${
                      task.assignedTo === currentPlayer.playerId
                        ? task.status === "completed"
                          ? "bg-green-500/20 border-green-500/50 hover:bg-green-500/30"
                          : task.status === "failed"
                          ? "bg-red-500/20 border-red-500/50 hover:bg-red-500/30"
                          : "bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/30"
                        : "bg-gray-700/30 border-gray-600/50 cursor-not-allowed"
                    }`}
                    onClick={() => {
                      if (
                        task.assignedTo === currentPlayer.playerId &&
                        task.status === "pending" &&
                        onTaskSelect
                      ) {
                        onTaskSelect(task);
                      }
                    }}
                  >
                    <div className="font-bold text-white text-lg mb-2">
                      {task.description}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-300">
                        {task.category} • {task.difficulty}
                      </div>
                      <div
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold ${
                          task.status === "completed"
                            ? "bg-green-500 text-white"
                            : task.status === "failed"
                            ? "bg-red-500 text-white"
                            : "bg-gray-600 text-white"
                        }`}
                      >
                        {task.status === "completed"
                          ? "✓ Completed"
                          : task.status === "failed"
                          ? "✗ Failed"
                          : "○ Pending"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">
                No tasks available in this room
              </p>
            )}
          </div>

          {/* Players in current room - always visible */}
          <div className="mb-4">
            <h4 className="font-bold mb-3 text-gray-300 uppercase tracking-wider text-sm">
              Players in Room:
            </h4>
            {getPlayersInCurrentRoom().length > 0 ? (
              <div className="space-y-2">
                {getPlayersInCurrentRoom().map((player) => {
                  const isMe = player.playerId === playerId;
                  return (
                    <div
                      key={player.playerId}
                      className={`p-4 rounded-xl flex items-center border-2 transition-all duration-200 ${
                        player.status === "dead"
                          ? "bg-red-500/20 border-red-500/50"
                          : isMe
                          ? "bg-blue-500/20 border-blue-500/50"
                          : "bg-gray-700/30 border-gray-600/50"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full mr-3 ${
                          player.status === "alive"
                            ? "bg-green-400"
                            : "bg-gray-400"
                        }`}
                      >
                        {player.status === "alive" && (
                          <div className="w-4 h-4 rounded-full bg-green-400 animate-ping"></div>
                        )}
                      </div>
                      <span
                        className={`font-bold text-white ${
                          isMe ? "text-lg" : ""
                        }`}
                      >
                        {player.name} {isMe && "(You)"}
                      </span>
                      <div className="ml-auto flex gap-2">
                        {player.isVenting && (
                          <span className="text-xs bg-purple-500 text-white px-3 py-1 rounded-lg font-bold">
                            VENTING
                          </span>
                        )}
                        {player.status === "dead" && (
                          <span className="text-xs bg-gray-500 text-white px-3 py-1 rounded-lg font-bold">
                            DEAD
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">
                No players in this room
              </p>
            )}
          </div>

          {/* {currentPlayer && currentPlayer.status === "alive" && (
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
              )} */}

          {/* {canKill && currentPlayer.role === "imposter" && (
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
              )} */}

          {canReport && currentPlayer.role === "crewmate" && (
            <button
              onClick={() => {
                if (deadPlayersInRoom.length > 0) {
                  handleReportBody(deadPlayersInRoom[0].playerId);
                }
              }}
              className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white py-4 px-6 rounded-xl text-lg font-bold transition-all duration-200 hover:scale-105 border border-yellow-500/50 flex items-center justify-center gap-2"
            >
              <svg
                className="w-6 h-6"
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
    </div>
  );
};

export default GameMap;
