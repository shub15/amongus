import Game from '../models/Game';
import Player from '../models/Player';

export class GameService {
    async createGameService(gameData: any) {
        const newGame = new Game(gameData);
        await newGame.save();
        return newGame;
    }

    async joinGameService(gameId: string, playerData: any) {
        const game = await Game.findById(gameId);
        if (!game) {
            throw new Error('Game not found');
        }
        const newPlayer = new Player(playerData);
        game.players.push(newPlayer);
        await game.save();
        return newPlayer;
    }

    async endGameService(gameId: string) {
        const game = await Game.findByIdAndDelete(gameId);
        if (!game) {
            throw new Error('Game not found');
        }
        return game;
    }
}