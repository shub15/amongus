import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateTaskSubmission = [
    body('taskId').isString().withMessage('Task ID must be a string'),
    body('playerId').isString().withMessage('Player ID must be a string'),
    body('status').isIn(['completed', 'in-progress']).withMessage('Status must be either completed or in-progress'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export const validatePlayerRegistration = [
    body('name').isString().withMessage('Name must be a string'),
    body('role').isIn(['imposter', 'crewmate']).withMessage('Role must be either imposter or crewmate'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];