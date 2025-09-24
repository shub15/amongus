import { Router } from 'express';
import PlayerController from '../controllers/playerController';
import { Application } from 'express';

const router = Router();
const playerController = PlayerController;

export const setPlayerRoutes = (app: Application): void => {
    app.use('/api/players', router);
    
    router.post('/register', playerController.registerPlayer);
    router.put('/status', playerController.updatePlayerStatus);
    router.get('/', playerController.getPlayers);
};