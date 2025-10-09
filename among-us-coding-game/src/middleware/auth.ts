import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Player from "../models/Player";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const secretKey = process.env.JWT_SECRET || "your_secret_key";
const adminSecret = process.env.ADMIN_SECRET || "dev_secret";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check for admin secret header (for development purposes)
  const adminSecretHeader = req.headers["x-admin-secret"];
  if (adminSecretHeader === adminSecret) {
    req.user = { role: "admin" };
    return next();
  }

  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, secretKey, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

export const generateToken = (user: any) => {
  return jwt.sign(user, secretKey, { expiresIn: "24h" });
};

// Middleware to check if user is an admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.role || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};

// Middleware to check if user is in a game
export const isInGame = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.user;

    if (!gameId || !playerId) {
      return res
        .status(400)
        .json({ message: "Game ID and Player ID are required" });
    }

    const player = await Player.findOne({ playerId, "games.gameId": gameId });
    if (!player) {
      return res.status(403).json({ message: "Player is not in this game" });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Error verifying game membership", error });
  }
};
