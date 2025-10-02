import { Router } from "express";
import PlayerController from "../controllers/playerController";
import { Application } from "express";
import { authenticateToken, isAdmin } from "../middleware/auth";
import { validatePlayerRegistration } from "../middleware/validation";

const router = Router();
const playerController = PlayerController;

export const setPlayerRoutes = (app: Application): void => {
  app.use("/api/players", router);

  // Public routes
  router.post(
    "/register",
    validatePlayerRegistration,
    playerController.registerPlayer
  );

  // Protected routes
  router.put("/status", authenticateToken, playerController.updatePlayerStatus);
  router.get("/", authenticateToken, playerController.getPlayers);
  router.get("/:playerId", authenticateToken, playerController.getPlayerById);

  // Admin routes
  router.put(
    "/assign-role",
    authenticateToken,
    isAdmin,
    playerController.assignRole
  );
};
