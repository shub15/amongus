import { Server } from "socket.io";
import { Server as HttpServer } from "http";

interface TaskCompletedData {
    gameId: string;
    taskId: string;
    playerId: string;
}

interface SabotageData {
    gameId: string;
    sabotageType: string;
    playerId: string;
}

const setupSocket = (server: HttpServer): Server => {
    const io = new Server(server);

    io.on("connection", (socket) => {
        console.log("A user connected: " + socket.id);

        socket.on("joinGame", (gameId: string) => {
            socket.join(gameId);
            console.log(`User ${socket.id} joined game ${gameId}`);
        });

        socket.on("taskCompleted", (data: TaskCompletedData) => {
            socket.to(data.gameId).emit("taskCompleted", data);
        });

        socket.on("sabotage", (data: SabotageData) => {
            socket.to(data.gameId).emit("sabotage", data);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected: " + socket.id);
        });
    });

    return io;
};

export default setupSocket;