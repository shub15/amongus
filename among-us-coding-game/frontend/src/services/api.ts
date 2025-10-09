import axios from "axios";

// Use environment variable or dynamically determine backend URL based on current host
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    console.log("API Request:", config.method?.toUpperCase(), config.url);
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to log responses
api.interceptors.response.use(
  (response) => {
    console.log(
      "API Response:",
      response.status,
      response.config.method?.toUpperCase(),
      response.config.url
    );
    return response;
  },
  (error) => {
    console.error(
      "API Error:",
      error.response?.status,
      error.response?.config.method?.toUpperCase(),
      error.response?.config.url,
      error.message
    );
    return Promise.reject(error);
  }
);

// Player API
export const playerAPI = {
  register: (name: string, gameId?: string) =>
    api.post("/players/register", { name, gameId }),

  getPlayer: (playerId: string) => api.get(`/players/${playerId}`),

  getPlayers: () => api.get("/players"),

  assignRole: (playerId: string, role: string) =>
    api.put("/players/assign-role", { playerId, role }),
};

// Game API
export const gameAPI = {
  createGame: (imposterCount: number = 1) =>
    api.post("/games", { imposterCount }),

  getAvailableGames: () => api.get("/games/available"),

  getAllGames: () => api.get("/games"),

  getGame: (gameId: string) => {
    console.log("Fetching game with ID:", gameId);
    return api.get(`/games/${gameId}`);
  },

  joinGame: (gameId: string, playerId: string) =>
    api.post(`/games/${gameId}/join`, { playerId }),

  startGame: (gameId: string) => api.post(`/games/${gameId}/start`),

  submitTask: (
    gameId: string,
    taskId: string,
    playerId: string,
    answer: string
  ) => api.post(`/games/${gameId}/submit-task`, { taskId, playerId, answer }),

  callMeeting: (gameId: string, playerId: string, reason: string) =>
    api.post(`/games/${gameId}/call-meeting`, { playerId, reason }),

  vote: (gameId: string, voterId: string, votedPlayerId: string) =>
    api.post(`/games/${gameId}/vote`, { voterId, votedPlayerId }),

  sabotage: (gameId: string, playerId: string, sabotageType: string) =>
    api.post(`/games/${gameId}/sabotage`, { playerId, sabotageType }),

  movePlayer: (gameId: string, playerId: string, targetRoom: string) =>
    api.post(`/games/${gameId}/move`, { playerId, targetRoom }),

  useVent: (gameId: string, playerId: string, targetRoom: string) =>
    api.post(`/games/${gameId}/use-vent`, { playerId, targetRoom }),

  killPlayer: (gameId: string, killerId: string, targetId: string) =>
    api.post(`/games/${gameId}/kill`, { killerId, targetId }),

  reportBody: (gameId: string, reporterId: string, deadPlayerId: string) =>
    api.post(`/games/${gameId}/report-body`, { reporterId, deadPlayerId }),

  endGame: (gameId: string) => api.post(`/games/${gameId}/end`),

  kickPlayer: (gameId: string, playerId: string) =>
    api.post(`/games/${gameId}/kick`, { playerId }),
};

// Task API
export const taskAPI = {
  getTasks: (playerId: string) => api.get(`/tasks/player/${playerId}`),

  getTask: (taskId: string) => api.get(`/tasks/${taskId}`),
};

export default api;