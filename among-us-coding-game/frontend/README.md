# Among Us Coding Game - Frontend

This is the frontend for the Among Us Coding Game, built with React, TypeScript, and Vite.

## Features

- Mobile-friendly responsive design
- Real-time gameplay with WebSocket communication
- Player registration and game lobby
- Task completion with technical questions
- Impostor sabotage mechanics
- Voting and meeting system
- Admin dashboard for game monitoring

## Tech Stack

- React 18 with TypeScript
- Vite for fast development and building
- React Router for navigation
- Socket.IO for real-time communication
- Tailwind CSS for styling
- Axios for API requests

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── pages/          # Page components for routing
├── services/       # API and socket services
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```
