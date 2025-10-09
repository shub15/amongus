import { Router } from "express";
import GameController from "../controllers/gameController";
import { Application } from "express";
import { authenticateToken, isAdmin } from "../middleware/auth";
import {
  validateGameCreation,
  validateSabotage,
  validateVoting,
  validateGameId,
} from "../middleware/validation";

const router = Router();
const gameController = new GameController();

export const setGameRoutes = (app: Application): void => {
  app.use("/api/games", router);

  // Public routes
  router.post("/", validateGameCreation, gameController.createGame);
  router.get("/available", gameController.getAvailableGames); // Add this line for quick join

  // Admin route to get all games
  router.get("/", authenticateToken, isAdmin, gameController.getAllGames);

  // Protected routes
  router.get(
    "/:gameId",
    validateGameId,
    authenticateToken,
    gameController.getGame
  );
  router.post(
    "/:gameId/join",
    validateGameId,
    authenticateToken,
    gameController.joinGame
  );
  router.post(
    "/:gameId/start",
    validateGameId,
    authenticateToken,
    gameController.startGame
  );
  router.post(
    "/:gameId/submit-task",
    validateGameId,
    authenticateToken,
    gameController.submitTask
  );
  router.post(
    "/:gameId/call-meeting",
    validateGameId,
    authenticateToken,
    gameController.callMeeting
  );
  router.post(
    "/:gameId/vote",
    validateGameId,
    authenticateToken,
    validateVoting,
    gameController.vote
  );
  router.post(
    "/:gameId/sabotage",
    validateGameId,
    authenticateToken,
    validateSabotage,
    gameController.sabotage
  );
  router.post(
    "/:gameId/move",
    validateGameId,
    authenticateToken,
    gameController.movePlayer
  );
  router.post(
    "/:gameId/use-vent",
    validateGameId,
    authenticateToken,
    gameController.useVent
  );
  router.post(
    "/:gameId/kill",
    validateGameId,
    authenticateToken,
    gameController.killPlayer
  );
  router.post(
    "/:gameId/report-body",
    validateGameId,
    authenticateToken,
    gameController.reportBody
  );
  router.post(
    "/:gameId/end",
    validateGameId,
    authenticateToken,
    gameController.endGame
  );
  router.delete(
    "/:gameId",
    validateGameId,
    authenticateToken,
    isAdmin,
    gameController.deleteGame
  );

  router.post(
    "/:gameId/kick",
    validateGameId,
    authenticateToken,
    isAdmin,
    gameController.kickPlayer
  );
};
