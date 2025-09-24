import { Router } from 'express';
import GameController from '../controllers/gameController';

const router = Router();
const gameController = new GameController();

export function setGameRoutes(app: Router) {
    app.use('/api/games', router);

    router.post('/', gameController.createGame.bind(gameController));
    router.post('/:gameId/join', gameController.joinGame.bind(gameController));
    router.delete('/:gameId', gameController.endGame.bind(gameController));
}