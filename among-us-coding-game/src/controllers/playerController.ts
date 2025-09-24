import { Request, Response } from 'express';
import Player from '../models/Player';

class PlayerController {
    async registerPlayer(req: Request, res: Response) {
        try {
            const { name, role } = req.body;
            const newPlayer = new Player({ name, role });
            await newPlayer.save();
            res.status(201).json(newPlayer);
        } catch (error) {
            res.status(500).json({ message: 'Error registering player', error });
        }
    }

    async updatePlayerStatus(req: Request, res: Response) {
        try {
            const { playerId, status } = req.body;
            const updatedPlayer = await Player.findByIdAndUpdate(playerId, { status }, { new: true });
            if (!updatedPlayer) {
                return res.status(404).json({ message: 'Player not found' });
            }
            res.json(updatedPlayer);
        } catch (error) {
            res.status(500).json({ message: 'Error updating player status', error });
        }
    }

    async getPlayers(req: Request, res: Response) {
        try {
            const players = await Player.find();
            res.json(players);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving players', error });
        }
    }
}

export default new PlayerController();