import React, { useState, useEffect, useRef } from "react";

interface Room {
  name: string;
  displayName: string;
  adjacentRooms: string[];
  ventsTo: string[];
  tasks: string[];
  position: { x: number; y: number };
}

interface Player {
  playerId: string;
  name: string;
  role: "crewmate" | "imposter" | "ghost";
  status: "alive" | "dead" | "disconnected";
  currentRoom: string;
  isVenting: boolean;
}

interface GameMapProps {
  gameId: string;
  playerId: string;
  playerRole: "crewmate" | "imposter" | "ghost";
  players: Player[];
  map: Room[];
  onMoveToRoom: (roomName: string) => void;
  onUseVent: (targetRoom: string) => void;
  onKillPlayer: (targetId: string) => void;
  onReportBody: (deadPlayerId: string) => void;
}

const GameMap: React.FC<GameMapProps> = ({
  gameId,
  playerId,
  playerRole,
  players,
  map,
  onMoveToRoom,
  onUseVent,
  onKillPlayer,
  onReportBody,
}) => {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [playersInRoom, setPlayersInRoom] = useState<Player[]>([]);
  const [canKill, setCanKill] = useState(false);
  const [canReport, setCanReport] = useState(false);
  const [deadPlayersInRoom, setDeadPlayersInRoom] = useState<Player[]>([]);
  const [ventCooldown, setVentCooldown] = useState(0);
  const [killCooldown, setKillCooldown] = useState(0);
  const [gridMap, setGridMap] = useState<Room[]>([]);

  // Pan state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Grid layout constants
  const ROOM_WIDTH = 80;
  const ROOM_HEIGHT = 80;
  const GRID_SPACING = 140; // Space between grid cells
  const GRID_COLS = 5; // Number of columns in grid

  // Arrange rooms in a proper grid layout
  useEffect(() => {
    if (map.length === 0) return;

    // Create a grid-based layout
    const arrangedRooms: Room[] = map.map((room, index) => {
      const col = index % GRID_COLS;
      const row = Math.floor(index / GRID_COLS);

      return {
        ...room,
        position: {
          x: col * GRID_SPACING + 50,
          y: row * GRID_SPACING + 50,
        },
      };
    });

    setGridMap(arrangedRooms);
  }, [map]);

  // Find current player
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

  // Update players in selected room
  useEffect(() => {
    if (selectedRoom) {
      const playersInSelectedRoom = players.filter(
        (player) => player.currentRoom === selectedRoom
      );
      setPlayersInRoom(playersInSelectedRoom);
    }
  }, [players, selectedRoom]);

  // Handle mouse pan events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Left mouse button
      setIsPanning(true);
      setStartPan({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      });
      if (containerRef.current) {
        containerRef.current.style.cursor = "grabbing";
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = "grab";
    }
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = "grab";
    }
  };

  // Handle room click
  const handleRoomClick = (roomName: string) => {
    setSelectedRoom(roomName);
  };

  // Handle vent usage
  const handleUseVent = () => {
    if (selectedRoom && currentPlayer) {
      const currentRoom = gridMap.find((r) => r.name === selectedRoom);
      if (currentRoom && currentRoom.ventsTo.length > 0) {
        onUseVent(currentRoom.ventsTo[0]);
      }
    }
  };

  // Handle kill action
  const handleKill = (targetId: string) => {
    onKillPlayer(targetId);
  };

  // Handle report body
  const handleReportBody = (deadPlayerId: string) => {
    onReportBody(deadPlayerId);
  };

  // Render room on map
  const renderRoom = (room: Room) => {
    const isCurrentRoom = currentPlayer?.currentRoom === room.name;
    const hasPlayers = players.some((p) => p.currentRoom === room.name);
    const isSelected = selectedRoom === room.name;

    return (
      <div
        key={room.name}
        className={`absolute w-20 h-20 rounded-lg cursor-pointer flex items-center justify-center text-xs text-center p-2 border-2 transition-all duration-200 ${
          isSelected
            ? "bg-blue-500 border-blue-300 text-white"
            : isCurrentRoom
            ? "bg-green-500 border-green-300 text-white"
            : hasPlayers
            ? "bg-yellow-500 border-yellow-300 text-black"
            : "bg-gray-700 border-gray-500 text-white"
        }`}
        style={{
          left: `${room.position.x}px`,
          top: `${room.position.y}px`,
        }}
        onClick={() => handleRoomClick(room.name)}
      >
        <div className="flex flex-col items-center">
          <span className="font-bold truncate w-full">{room.displayName}</span>
          {isCurrentRoom && <span className="text-xs mt-1">YOU</span>}
        </div>
      </div>
    );
  };

  // Render player in room details
  const renderPlayer = (player: Player) => {
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
            player.status === "alive" ? "bg-green-400" : "bg-gray-400"
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
          <span className="ml-2 text-xs bg-gray-500 px-1 rounded">DEAD</span>
        )}
      </div>
    );
  };

  // Get direction for positioning arrows
  const getDirection = (fromRoom: Room, toRoom: Room) => {
    const dx = toRoom.position.x - fromRoom.position.x;
    const dy = toRoom.position.y - fromRoom.position.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? "right" : "left";
    } else {
      return dy > 0 ? "down" : "up";
    }
  };

  // Render movement arrows around the selected room
  const renderMovementArrows = () => {
    if (
      !selectedRoom ||
      !currentPlayer ||
      currentPlayer.currentRoom !== selectedRoom ||
      currentPlayer.status !== "alive"
    ) {
      return null;
    }

    const currentRoom = gridMap.find((r) => r.name === selectedRoom);
    if (!currentRoom) return null;

    const adjacentRooms = getAdjacentRooms();
    if (adjacentRooms.length === 0) return null;

    return adjacentRooms.map((room) => {
      const direction = getDirection(currentRoom, room);
      let arrowStyle = {};

      // Position arrows around the room based on direction
      // Adjust for panning by using the same positioning logic
      switch (direction) {
        case "up":
          arrowStyle = {
            left: `${currentRoom.position.x + ROOM_WIDTH / 2 - 15}px`,
            top: `${currentRoom.position.y - 40}px`,
          };
          break;
        case "down":
          arrowStyle = {
            left: `${currentRoom.position.x + ROOM_WIDTH / 2 - 15}px`,
            top: `${currentRoom.position.y + ROOM_HEIGHT + 10}px`,
          };
          break;
        case "left":
          arrowStyle = {
            left: `${currentRoom.position.x - 40}px`,
            top: `${currentRoom.position.y + ROOM_HEIGHT / 2 - 15}px`,
          };
          break;
        case "right":
          arrowStyle = {
            left: `${currentRoom.position.x + ROOM_WIDTH + 10}px`,
            top: `${currentRoom.position.y + ROOM_HEIGHT / 2 - 15}px`,
          };
          break;
      }

      return (
        <button
          key={`arrow-${room.name}`}
          onClick={() => onMoveToRoom(room.name)}
          className="absolute w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg z-10 transition-transform hover:scale-110"
          style={arrowStyle}
          title={`Move to ${room.displayName}`}
        >
          <svg
            className="w-5 h-5 text-white"
            style={{
              transform: `rotate(${
                direction === "up"
                  ? "0deg"
                  : direction === "right"
                  ? "90deg"
                  : direction === "down"
                  ? "180deg"
                  : "270deg"
              })`,
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      );
    });
  };

  // Get adjacent rooms for current player's room
  const getAdjacentRooms = () => {
    if (
      !currentPlayer ||
      !selectedRoom ||
      currentPlayer.currentRoom !== selectedRoom
    ) {
      return [];
    }

    const currentRoom = gridMap.find((r) => r.name === selectedRoom);
    if (!currentRoom) {
      return [];
    }

    return currentRoom.adjacentRooms
      .map((roomName: string) => gridMap.find((r: Room) => r.name === roomName))
      .filter((room): room is Room => room !== undefined);
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4">
        Ship Map{" "}
        <span className="text-sm text-gray-400">(Click and drag to pan)</span>
      </h2>

      {/* Map visualization with pan */}
      <div
        ref={containerRef}
        className={`relative bg-slate-900 rounded-lg p-4 mb-4 overflow-hidden border-2 border-slate-700 ${
          isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ height: "500px" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Panning container */}
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            transition: isPanning ? "none" : "transform 0.1s ease-out",
            position: "relative",
            width: "100%",
            height: "100%",
          }}
        >
          {/* Connection lines - rendered first so they appear behind rooms */}
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            style={{
              width: `${GRID_COLS * GRID_SPACING + 200}px`,
              height: `${
                Math.ceil(gridMap.length / GRID_COLS) * GRID_SPACING + 200
              }px`,
              zIndex: 1,
            }}
          >
            {/* Adjacent room connections */}
            {gridMap.map((room) => {
              return room.adjacentRooms.map((adjacentRoomName) => {
                const adjacentRoom = gridMap.find(
                  (r) => r.name === adjacentRoomName
                );
                if (adjacentRoom) {
                  return (
                    <line
                      key={`adjacent-${room.name}-${adjacentRoomName}`}
                      x1={room.position.x + ROOM_WIDTH / 2}
                      y1={room.position.y + ROOM_HEIGHT / 2}
                      x2={adjacentRoom.position.x + ROOM_WIDTH / 2}
                      y2={adjacentRoom.position.y + ROOM_HEIGHT / 2}
                      stroke="#6b7280"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  );
                }
                return null;
              });
            })}

            {/* Vent connections */}
            {gridMap.map((room) => {
              return room.ventsTo.map((ventRoomName) => {
                const ventRoom = gridMap.find((r) => r.name === ventRoomName);
                if (ventRoom) {
                  return (
                    <line
                      key={`vent-${room.name}-${ventRoomName}`}
                      x1={room.position.x + ROOM_WIDTH / 2}
                      y1={room.position.y + ROOM_HEIGHT / 2}
                      x2={ventRoom.position.x + ROOM_WIDTH / 2}
                      y2={ventRoom.position.y + ROOM_HEIGHT / 2}
                      stroke="#c084fc"
                      strokeWidth="2"
                    />
                  );
                }
                return null;
              });
            })}
          </svg>

          {/* Rooms */}
          {gridMap.map(renderRoom)}

          {/* Movement arrows */}
          {renderMovementArrows()}
        </div>
      </div>

      {/* Room details panel */}
      {selectedRoom && (
        <div className="bg-slate-700 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-2">
            {gridMap.find((r) => r.name === selectedRoom)?.displayName}
          </h3>

          {/* Players in room */}
          <div className="mb-4">
            <h4 className="font-bold mb-2">Players in Room:</h4>
            {playersInRoom.length > 0 ? (
              playersInRoom.map(renderPlayer)
            ) : (
              <p className="text-gray-400">No players in this room</p>
            )}
          </div>

          {/* Actions panel */}
          {currentPlayer && currentPlayer.status === "alive" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* Vent button (impostors only) */}
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

              {/* Kill button (impostors only) */}
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

              {/* Report button (crewmates only) */}
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

          {/* Dead players in room */}
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
