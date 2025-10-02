import { io, Socket } from "socket.io-client";

// Updated to use the correct backend URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      console.log("Connecting to socket server at:", SOCKET_URL);
      this.socket = io(SOCKET_URL, {
        transports: ["websocket", "polling"], // Allow both transports as fallback
        withCredentials: true,
        timeout: 10000, // Increased timeout
        reconnection: true,
        reconnectionAttempts: 5, // Increased attempts
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        autoConnect: true,
      });

      this.socket.on("connect", () => {
        console.log("Connected to socket server with ID:", this.socket?.id);
      });

      this.socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      this.socket.on("connect_timeout", (timeout) => {
        console.error("Socket connection timeout:", timeout);
      });

      this.socket.on("disconnect", (reason) => {
        console.log("Disconnected from socket server. Reason:", reason);
      });
    }
  }

  disconnect() {
    if (this.socket) {
      console.log("Disconnecting from socket server");
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinGame(gameId: string, playerId: string) {
    if (this.socket) {
      console.log("Joining game:", gameId, "with player:", playerId);
      this.socket.emit("joinGame", { gameId, playerId }, (response: any) => {
        console.log("Join game response:", response);
      });
    } else {
      console.error("Socket not connected");
    }
  }

  leaveGame(gameId: string, playerId: string) {
    if (this.socket) {
      console.log("Leaving game:", gameId, "with player:", playerId);
      this.socket.emit("leaveGame", { gameId, playerId }, (response: any) => {
        console.log("Leave game response:", response);
      });
    } else {
      console.error("Socket not connected");
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      console.log("Listening for event:", event);
      this.socket.on(event, callback);
    } else {
      console.error("Socket not connected");
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    } else {
      console.error("Socket not connected");
    }
  }

  emit(event: string, data: any, callback?: (...args: any[]) => void) {
    if (this.socket) {
      console.log("Emitting event:", event, "with data:", data);
      if (callback) {
        this.socket.emit(event, data, callback);
      } else {
        this.socket.emit(event, data);
      }
    } else {
      console.error("Socket not connected");
    }
  }
}

export default new SocketService();
