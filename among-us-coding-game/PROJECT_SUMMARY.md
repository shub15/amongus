# Among Us Coding Game - Project Summary

## Overview

This project implements a complete Among Us-style game with a technical twist. Players join games on their smartphones and are assigned roles as either crewmates or impostors. Crewmates must complete technical coding questions to win, while impostors can sabotage systems and eliminate crewmates.

## Components Implemented

### 1. Backend (Node.js/Express/MongoDB)

- **Enhanced Data Models**: Player, Game, and Task models with all required fields
- **Authentication System**: JWT-based authentication with role-based access control
- **RESTful API**: Complete API for game management, player actions, and task handling
- **WebSocket Communication**: Real-time updates for game events
- **Game Logic**: Full implementation of game mechanics including:
  - Role assignment (crewmate/impostor)
  - Task creation and validation
  - Sabotage mechanics
  - Voting and meeting system
  - Win condition checking

### 2. Frontend (React/TypeScript)

- **Responsive UI**: Mobile-friendly interface for players
- **Game Lobby**: Player registration and game joining
- **Game Interface**: Real-time gameplay with task completion
- **Impostor Features**: Sabotage controls for impostors
- **Voting System**: Meeting interface and voting mechanics
- **Admin Dashboard**: Game monitoring and player management

### 3. Key Features

- **Technical Questions**: Players answer coding-related questions to complete tasks
- **Real-time Updates**: WebSocket-based communication for instant updates
- **Role Management**: Admin can assign roles and monitor games
- **Game States**: Complete game flow from lobby to completion
- **Mobile Optimization**: Touch-friendly interface for smartphones

## Technical Implementation Details

### Data Models

- **Player Model**: Tracks player information, roles, status, tasks, and voting history
- **Game Model**: Manages game state, players, tasks, voting, and win conditions
- **Task Model**: Stores technical questions with multiple-choice answers

### API Endpoints

- Player registration and management
- Game creation, joining, and control
- Task submission and validation
- Sabotage initiation (impostor only)
- Meeting calling and voting

### WebSocket Events

- Real-time player joining/leaving notifications
- Task completion updates
- Sabotage alerts
- Meeting calls and voting updates
- Game start/end notifications

### Game Logic

- **Role Assignment**: Random assignment of impostors based on game settings
- **Task Generation**: Technical questions assigned to crewmates only
- **Sabotage System**: Impostors can initiate system failures
- **Voting Mechanics**: Players can call meetings and vote to eject others
- **Win Conditions**:
  - Crewmates win by completing tasks or ejecting all impostors
  - Impostors win by eliminating enough crewmates to equal their numbers

## How to Run the Application

1. **Backend Setup**:

   - Install MongoDB
   - Configure environment variables
   - Run `npm install` and `npm run dev`

2. **Frontend Setup**:

   - Navigate to frontend directory
   - Run `npm install` and `npm run dev`

3. **Playing the Game**:
   - Create a game as host
   - Share game ID with other players
   - Join game and wait for start
   - Complete tasks (crewmates) or sabotage (impostors)
   - Call meetings and vote strategically
   - Win as a team!

## Future Enhancements

- Enhanced admin dashboard with detailed game analytics
- More sophisticated technical question database
- Additional sabotage mechanics
- Chat functionality
- Game replay and statistics
- Mobile app versions
