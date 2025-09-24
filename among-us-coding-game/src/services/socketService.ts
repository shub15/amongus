import { Server } from 'socket.io';

class SocketService {
    private io: Server;

    constructor(server: any) {
        this.io = new Server(server);
        this.initializeSocketEvents();
    }

    private initializeSocketEvents() {
        this.io.on('connection', (socket) => {
            console.log('A user connected: ' + socket.id);

            socket.on('disconnect', () => {
                console.log('User disconnected: ' + socket.id);
            });

            socket.on('joinGame', (gameId: string) => {
                socket.join(gameId);
                this.io.to(gameId).emit('playerJoined', socket.id);
            });

            socket.on('taskCompleted', (data: { gameId: string; taskId: string; playerId: string }) => {
                this.io.to(data.gameId).emit('taskUpdate', data);
            });

            socket.on('sabotage', (gameId: string) => {
                this.io.to(gameId).emit('sabotageAlert');
            });
        });
    }

    public emitToGame(gameId: string, event: string, data: any) {
        this.io.to(gameId).emit(event, data);
    }
}

export default SocketService;