import { Request, Response } from "express";
import Player from "../models/Player";
import Game from "../models/Game";
import { generateToken } from "../middleware/auth";

class PlayerController {
  async registerPlayer(req: Request, res: Response) {
    try {
      const { name, gameId } = req.body;
      console.log("Registering player with name:", name, "and gameId:", gameId);

      // Create a new player
      const playerId = `player_${Date.now()}_${Math.floor(
        Math.random() * 1000
      )}`;
      const newPlayer = new Player({
        playerId,
        name,
        role: "crewmate", // Default role, will be assigned later
        status: "alive",
        isOnline: true,
        tasks: [],
        completedTasks: [],
        votes: [],
        hasVoted: false,
        isImpostor: false,
        currentRoom: "cafeteria", // Default starting room
        lastKillTime: null,
        isVenting: false,
      });

      await newPlayer.save();
      console.log("Player saved successfully:", newPlayer.playerId);

      // Add player to game if gameId is provided
      if (gameId) {
        console.log("Adding player to game:", gameId);
        const game = await Game.findOne({ gameId });
        if (game) {
          console.log("Found game, adding player to it");
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
          console.log("Player added to game successfully");
        } else {
          console.log("Game not found with ID:", gameId);
        }
      }

      // Generate token for the player
      const token = generateToken({
        playerId: newPlayer.playerId,
        name: newPlayer.name,
      });

      res.status(201).json({ player: newPlayer, token });
    } catch (error) {
      console.error("Error registering player:", error);
      res.status(500).json({ message: "Error registering player", error });
    }
  }

  async updatePlayerStatus(req: Request, res: Response) {
    try {
      const { playerId, status } = req.body;
      const updatedPlayer = await Player.findOneAndUpdate(
        { playerId },
        { status },
        { new: true }
      );

      if (!updatedPlayer) {
        return res.status(404).json({ message: "Player not found" });
      }

      res.json(updatedPlayer);
    } catch (error) {
      res.status(500).json({ message: "Error updating player status", error });
    }
  }

  async getPlayers(req: Request, res: Response) {
    try {
      const players = await Player.find();
      res.json(players);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving players", error });
    }
  }

  async getPlayerById(req: Request, res: Response) {
    try {
      const { playerId } = req.params;
      const player = await Player.findOne({ playerId });

      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      res.json(player);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving player", error });
    }
  }

  async assignRole(req: Request, res: Response) {
    try {
      const { playerId, role } = req.body;
      const updatedPlayer = await Player.findOneAndUpdate(
        { playerId },
        { role, isImpostor: role === "imposter" },
        { new: true }
      );

      if (!updatedPlayer) {
        return res.status(404).json({ message: "Player not found" });
      }

      res.json({
        message: "Role assigned successfully",
        player: updatedPlayer,
      });
    } catch (error) {
      res.status(500).json({ message: "Error assigning role", error });
    }
  }
}

export default new PlayerController();
