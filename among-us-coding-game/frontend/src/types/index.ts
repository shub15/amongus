export interface Player {
  playerId: string;
  name: string;
  role: "crewmate" | "imposter" | "ghost";
  status: "alive" | "dead" | "disconnected";
  isOnline: boolean;
  tasks: string[];
  completedTasks: string[];
  votes: string[];
  hasVoted: boolean;
  isImpostor: boolean;
}

export interface Task {
  taskId: string;
  description: string;
  assignedTo: string;
  status: "pending" | "completed" | "failed";
  question: string;
  answer: string;
  options: string[];
  category: string;
  difficulty: "easy" | "medium" | "hard";
  createdAt: Date;
  completedAt: Date | null;
}

export interface Game {
  gameId: string;
  players: Player[];
  tasks: Task[];
  gameStatus: "waiting" | "in-progress" | "discussion" | "voting" | "ended";
  imposterCount: number;
  currentSabotage: string | null;
  votes: Map<string, string>;
  voteHistory: Array<{ round: number; votes: Map<string, string> }>;
  deadPlayers: string[];
  meetingCalledBy: string | null;
  createdAt: Date;
  startedAt: Date | null;
  endedAt: Date | null;
  winner: "crewmates" | "impostors" | null;
}
