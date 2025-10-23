import express from "express";
import * as http from "http";
import { Server } from "socket.io";

import { createGame, GameConfig, handleGuess, Game } from "./game";
import {
	determineDuelOutcome,
	getSocketIdFor,
	mapPlayerSocket,
} from "./helpers/utils";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "http://localhost:5173", // your Vite dev server
	},
});

const PORT = process.env.PORT || 4000;

// Store active games in memory (can use Redis or some DB later)
const games = new Map<string, Game>();

io.on("connection", (socket) => {
	console.log(`Player connected: ${socket.id}`);

	// Duel mode: creator provides settings and secret; gets a gameId to share
	socket.on(
		"create-duel",
		(
			playerName: string,
			gameConfig: GameConfig,
			secretWord: string,
			callback,
		) => {
			const game = createGame(playerName, gameConfig, playerName);
			console.log(`Duel created: ${game.id}`);
			games.set(game.id, game);
			socket.join(game.id);
			mapPlayerSocket(game.id, playerName, socket.id);
			// validate secret length
			if (secretWord && secretWord.length === gameConfig.wordLength) {
				game.setSecret(playerName, secretWord);
			}
			if (typeof callback === "function") callback({ gameId: game.id });
			// notify creator to wait for opponent
			socket.emit("duel-waiting", { gameId: game.id, gameConfig });
		},
	);

	// Duel mode: joiner enters code, then must submit their secret to start
	socket.on("join-duel", (data, callback) => {
		const { gameId, playerName } = data || {};
		const game = games.get(gameId);
		if (!game) return callback?.({ error: "Game not found" });

		game.addPlayer(playerName, playerName);
		socket.join(game.id);
		mapPlayerSocket(game.id, playerName, socket.id);
		// ask this client to submit their secret; show settings read-only
		socket.emit("duel-need-secret", {
			gameId: game.id,
			gameConfig: game.gameConfig,
		});
		callback?.({ ok: true, gameId: game.id });
	});

	socket.on("submit-secret", (data, callback) => {
		const { gameId, secretWord, playerName } = data || {};
		const game = games.get(gameId);
		if (!game) return callback?.({ error: "Game not found" });
		if (!secretWord || secretWord.length !== game.gameConfig.wordLength) {
			return callback?.({ error: "Invalid secret word length" });
		}
		game.setSecret(playerName, secretWord);
		if (game.readyToStartDuel()) {
			// start game for each player individually with per-player state
			game.players.forEach((_, pname) => {
				const playerState = game.getPlayerState(pname);
				const sid = getSocketIdFor(game.id, pname);
				if (playerState && sid)
					io.to(sid).emit("game-start", playerState);
			});
		}
		callback?.({ ok: true });
	});

	socket.on(
		"create-game",
		(playerName: string, gameConfig: GameConfig, callback) => {
			const game = createGame(playerName, gameConfig, playerName);
			console.log(`Game created: ${game.id}`);
			games.set(game.id, game);
			socket.join(game.id);
			mapPlayerSocket(game.id, playerName, socket.id);
			callback({ gameId: game.id });
			// send initial state to creator (per-player)
			const st = game.getPlayerState(playerName);
			if (st) socket.emit("game-start", st);
		},
	);

	socket.on("join-game", (data, callback) => {
		const { gameId, playerName } = data;
		const game = games.get(gameId);
		if (!game) return callback({ error: "Game not found" });

		game.addPlayer(playerName, playerName);
		socket.join(game.id);
		mapPlayerSocket(game.id, playerName, socket.id);

		// Notify players the game is ready (per-player states)
		game.players.forEach((_, pname) => {
			const st = game.getPlayerState(pname);
			const sid = getSocketIdFor(game.id, pname);
			if (st && sid) io.to(sid).emit("game-start", st);
		});
		// acknowledge join to the joining client
		if (typeof callback === "function")
			callback({ ok: true, gameId: game.id });
	});

	socket.on("submit-word", (data) => {
		console.log("submit-word received:", data);
		const { gameId, guess, playerName } = data;
		const game = games.get(gameId);
		if (!game) return;

		const result = handleGuess(game, playerName, guess);
		console.log("handleGuess result:", result);
		io.to(game.id).emit("game-update", result);
		// If duel mode and both finished, compute winner and notify via helper
		const outcome = determineDuelOutcome(game);
		if (outcome) io.to(game.id).emit("duel-result", outcome);
	});

	socket.on("disconnect", () => {
		console.log(`Player disconnected: ${socket.id}`);
		// TODO: handle cleanup, notify other player, etc.
	});
});

server.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
