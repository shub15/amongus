import { Request, Response } from "express";
import { GameService } from "../services/gameService";

class GameController {
  private gameService: GameService;

  constructor() {
    this.gameService = new GameService();
  }

  public createGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const game = await this.gameService.createGameService(req.body);
      res.status(201).json(game);
    } catch (error) {
      res
        .status(500)
        .json({
          message:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
    }
  };

  public joinGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const game = await this.gameService.joinGameService(
        req.params.gameId,
        req.body.playerId
      );
      res.status(200).json(game);
    } catch (error) {
      res
        .status(500)
        .json({
          message:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
    }
  };

  public endGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.gameService.endGameService(req.params.gameId);
      res.status(200).json(result);
    } catch (error) {
      res
        .status(500)
        .json({
          message:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
    }
  };
}

export default GameController;
