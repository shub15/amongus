import { Router } from 'express';
import GameController from '../controllers/gameController';

const router = Router();
const gameController = new GameController();

export function setGameRoutes(app: Router) {
    app.post('/api/games', gameController.createGame.bind(gameController));
    app.post('/api/games/:gameId/join', gameController.joinGame.bind(gameController));
    app.delete('/api/games/:gameId', gameController.endGame.bind(gameController));
}