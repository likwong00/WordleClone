import express from "express";
import * as http from "http";
import { Server } from "socket.io";
import { createGame, GameConfig, handleGuess } from "./game";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "http://localhost:5173", // your Vite dev server
	},
});

const PORT = process.env.PORT || 4000;

// Store active games in memory (you can use Redis later)
const games = new Map<string, ReturnType<typeof createGame>>();

io.on("connection", (socket) => {
	console.log(`Player connected: ${socket.id}`);

	socket.on("create-game", (playerName: string, gameConfig: GameConfig, callback) => {
		const game = createGame(socket.id, gameConfig, playerName);
        console.log(`Game created: ${game.id}`);
		games.set(game.id, game);
		socket.join(game.id);
		callback({ gameId: game.id });
		// send initial state to creator
		socket.emit("game-start", game.getState());
	});

	socket.on("join-game", (data, callback) => {
		const { gameId, playerName } = data;
		const game = games.get(gameId);
		if (!game) return callback({ error: "Game not found" });

		game.addPlayer(socket.id, playerName);
		socket.join(game.id);

			// Notify both players the game is ready
			io.to(game.id).emit("game-start", game.getState());
			// acknowledge join to the joining client
			if (typeof callback === "function") callback({ ok: true, gameId: game.id });
	});

	socket.on("submit-word", (data) => {
			console.log("submit-word received:", data);
			const { gameId, guess, playerId } = data;
		const game = games.get(gameId);
		if (!game) return;

		const result = handleGuess(game, playerId, guess);
			console.log("handleGuess result:", result);
		io.to(game.id).emit("game-update", result);
	});

	socket.on("disconnect", () => {
		console.log(`Player disconnected: ${socket.id}`);
		// TODO: handle cleanup, notify other player, etc.
	});
});

server.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
