import Game from "../models/Game";
import Player from "../models/Player";

export class GameService {
  async createGameService(gameData: any) {
    const newGame = new Game(gameData);
    await newGame.save();
    return newGame;
  }

  async joinGameService(gameId: string, playerData: any) {
    const game = await Game.findById(gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    const newPlayer = new Player({
      ...playerData,
      currentRoom: "cafeteria", // Default starting room
      lastKillTime: null,
      isVenting: false,
    });
    game.players.push({
      playerId: newPlayer.playerId,
      name: newPlayer.name,
      role: newPlayer.role,
      status: newPlayer.status,
      isOnline: newPlayer.isOnline,
      tasks: newPlayer.tasks,
      completedTasks: newPlayer.completedTasks,
      votes: newPlayer.votes,
      hasVoted: newPlayer.hasVoted,
      currentRoom: newPlayer.currentRoom,
      lastKillTime: newPlayer.lastKillTime,
      isVenting: newPlayer.isVenting,
    });
    await game.save();
    return newPlayer;
  }

  async endGameService(gameId: string) {
    const game = await Game.findByIdAndDelete(gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    return game;
  }
}
