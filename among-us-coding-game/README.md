# Among Us Coding Game

A tech-based multiplayer game where players receive coding-related tasks on their smartphones, featuring one imposter who can sabotage others.

## Features

- **Multiplayer Gameplay**: Players join games and are assigned roles (crewmate or imposter)
- **Technical Questions**: Crewmates complete tasks by answering coding-related questions
- **Sabotage Mechanics**: Impostors can sabotage systems to disrupt crewmates
- **Voting System**: Players can call meetings and vote to eject impostors
- **Real-time Communication**: WebSocket-based real-time updates
- **Admin Dashboard**: Monitor games and assign roles
- **Mobile-friendly UI**: Responsive design for smartphones
- **LAN Support**: Play with friends on the same local network

## Tech Stack

### Backend

- Node.js with TypeScript
- Express.js for REST API
- MongoDB with Mongoose for data storage
- Socket.IO for real-time communication
- JWT for authentication

### Frontend

- React with TypeScript
- Vite for fast development
- React Router for navigation
- Tailwind CSS for styling

## Project Structure

```
among-us-coding-game/
├── src/
│   ├── controllers/     # Request handlers
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── middleware/      # Authentication and validation
│   ├── config/          # Configuration files
│   └── tests/           # Unit and integration tests
├── frontend/            # React frontend application
└── README.md            # This file
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory:

   ```env
   MONGO_URI=mongodb://localhost:27017/among-us-coding-game
   JWT_SECRET=your_jwt_secret_here
   CLIENT_URL=http://localhost:3000
   PORT=3000
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory:

   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   VITE_SOCKET_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## LAN Setup

To play the game with friends on the same local network:

### Quick Start (Windows)

1. Run the provided batch script:
   ```bash
   start-lan.bat
   ```

### Manual Setup

1. Find your server IP address:

   ```bash
   npm run get-ip
   ```

2. Start the backend server with LAN access:

   ```bash
   npm run dev:lan
   ```

3. In a separate terminal, start the frontend server with LAN access:

   ```bash
   cd frontend
   npm run dev:lan
   ```

4. Other players can access the game at `http://YOUR_SERVER_IP:3001`

For detailed instructions, see [LAN_SETUP.md](LAN_SETUP.md)

## API Endpoints

### Player Management

- `POST /api/players/register` - Register a new player
- `GET /api/players` - Get all players
- `GET /api/players/:playerId` - Get a specific player
- `PUT /api/players/assign-role` - Assign a role to a player (admin only)

### Game Management

- `POST /api/games` - Create a new game
- `GET /api/games/:gameId` - Get game details
- `POST /api/games/:gameId/join` - Join a game
- `POST /api/games/:gameId/start` - Start a game
- `POST /api/games/:gameId/end` - End a game

### Task Management

- `POST /api/games/:gameId/submit-task` - Submit a task answer
- `POST /api/games/:gameId/call-meeting` - Call a meeting
- `POST /api/games/:gameId/vote` - Vote for a player
- `POST /api/games/:gameId/sabotage` - Sabotage systems (impostor only)

## Game Flow

1. **Game Creation**: A player creates a new game and becomes the host
2. **Player Joining**: Other players join using the game ID
3. **Role Assignment**: Roles are randomly assigned when the game starts
4. **Task Completion**: Crewmates complete technical questions to progress
5. **Sabotage**: Impostors can sabotage systems to disrupt crewmates
6. **Meetings**: Players can call meetings to discuss and vote
7. **Voting**: Players vote to eject suspected impostors
8. **Win Conditions**:
   - Crewmates win by completing all tasks or ejecting all impostors
   - Impostors win by outnumbering the crewmates

## WebSocket Events

- `joinGame` - Player joins a game room
- `playerJoined` - Notify when a new player joins
- `gameStarted` - Notify when the game starts
- `taskUpdate` - Notify when a task is completed
- `sabotageAlert` - Notify when sabotage occurs
- `meetingCalled` - Notify when a meeting is called
- `voteRecorded` - Notify when a vote is recorded
- `voteResult` - Notify the result of voting
- `gameEnded` - Notify when the game ends

## Development

### Running Tests

Backend tests:

```bash
npm test
```

Frontend tests:

```bash
cd frontend
npm test
```

### Building for Production

Backend:

```bash
npm run build
```

Frontend:

```bash
cd frontend
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Inspired by the popular game Among Us
- Built with modern web technologies
