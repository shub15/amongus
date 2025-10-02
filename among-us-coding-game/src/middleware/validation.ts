import { Request, Response, NextFunction } from "express";
import { body, validationResult, param } from "express-validator";

export const validateTaskSubmission = [
  body("taskId").isString().withMessage("Task ID must be a string"),
  body("playerId").isString().withMessage("Player ID must be a string"),
  body("answer").isString().withMessage("Answer must be a string"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validatePlayerRegistration = [
  body("name")
    .isString()
    .withMessage("Name must be a string")
    .isLength({ min: 1, max: 20 })
    .withMessage("Name must be between 1 and 20 characters"),
  body("gameId").isString().withMessage("Game ID must be a string"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateGameCreation = [
  body("imposterCount")
    .isInt({ min: 1, max: 3 })
    .withMessage("Imposter count must be between 1 and 3"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateSabotage = [
  body("sabotageType").isString().withMessage("Sabotage type must be a string"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateVoting = [
  body("votedPlayerId")
    .isString()
    .withMessage("Voted player ID must be a string"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateGameId = [
  param("gameId").isString().withMessage("Game ID must be a string"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
