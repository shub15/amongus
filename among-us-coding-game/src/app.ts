import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { setGameRoutes } from './routes/gameRoutes';
import { setPlayerRoutes } from './routes/playerRoutes';
import { setTaskRoutes } from './routes/taskRoutes';
import socketService from './services/socketService';
import { databaseConfig } from './config/database';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.json());

// Database connection
mongoose.connect(databaseConfig.uri, databaseConfig.options)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// WebSocket setup
socketService(io);

// Routes
setGameRoutes(app);
setPlayerRoutes(app);
setTaskRoutes(app);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});