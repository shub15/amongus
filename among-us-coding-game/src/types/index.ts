export interface Game {
    gameId: string;
    players: Player[];
    tasks: Task[];
    gameStatus: 'waiting' | 'in-progress' | 'completed';
}

export interface Player {
    playerId: string;
    name: string;
    role: 'imposter' | 'crewmate';
    status: 'active' | 'inactive';
}

export interface Task {
    taskId: string;
    description: string;
    assignedTo: string;
    status: 'pending' | 'completed';
}