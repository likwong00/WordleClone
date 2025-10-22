import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export type TileState = "absent" | "present" | "correct" | "empty";

export type GameConfig = {
	maxGuesses: number;
	wordLength: number;
	extraWordPool?: string[];
};

type ServerState = {
	board: string[];
	states: TileState[][];
	currentRow: number;
	gameOver: boolean;
	answer: string;
	lastResult: "win" | "lose" | null;
	letterStates?: Record<string, TileState>;
	message?: string;
	shake?: boolean;
};

const DEFAULT_GAME_CONFIG: GameConfig = {
	maxGuesses: 6,
	wordLength: 5,
};

export function useGame() {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [playerId, setPlayerId] = useState<string | null>(null);
	const [state, setState] = useState<ServerState | null>(null);
	const [currentGameConfig, setCurrentGameConfig] =
		useState<GameConfig>(DEFAULT_GAME_CONFIG);
	const [connected, setConnected] = useState(false);
	const [currentGuess, setCurrentGuess] = useState("");
	const [boardShake, setBoardShake] = useState(false);

	useEffect(() => {
		const s = io("http://localhost:4000");
		setSocket(s);
		s.on("connect", () => {
			// s.id can be undefined in some socket.io versions during initial connect,
			// guard before writing into state which expects string | null
			if (s.id) setPlayerId(s.id);
			setConnected(true);
		});
		s.on("game-start", (state: ServerState) => {
			console.log("socket game-start:", state);
			setState(state);
			setCurrentGuess("");
		});
		s.on("game-update", (incoming: Partial<ServerState>) => {
			console.log("socket game-update:", incoming);
			setState((prev) => {
				if (!prev) return incoming as ServerState;
				const merged = {
					...prev,
					...incoming,
					board:
						Array.isArray(incoming?.board) &&
						incoming.board.length > 0
							? incoming.board
							: prev.board,
					states:
						Array.isArray(incoming?.states) &&
						incoming.states.length > 0
							? incoming.states
							: prev.states,
					currentRow:
						typeof incoming?.currentRow === "number"
							? incoming.currentRow
							: prev.currentRow,
					letterStates: incoming?.letterStates ?? prev.letterStates,
					message: incoming?.message ?? undefined,
				} as ServerState;

				// Retrigger shake locally on every invalid submission (server sends a message)
				if (incoming?.message) {
					setBoardShake(false);
					setTimeout(() => setBoardShake(true), 0);
				}

				if (!incoming?.gameOver) {
					setCurrentGuess("");
				}

				return merged;
			});
		});
		s.on("connect_error", (err: any) => {
			console.error("socket connect_error:", err);
			setConnected(false);
		});
		s.on("disconnect", (reason: string) => {
			console.warn("socket disconnected:", reason);
			setConnected(false);
		});
		// cleanup should return void (or a function that returns void).
		// s.disconnect() returns the socket instance; wrap it in a void-returning function.
		return () => {
			s.disconnect();
		};
	}, []);

	const createGame = useCallback(
		(gameconfig: GameConfig, playerName?: string) => {
			if (!socket) return;
			const emitCreate = () =>
				socket.emit(
					"create-game",
					playerName,
					gameconfig,
					(res: any) => {
						console.log("create-game ack:", res);
						if (res?.gameId) setSessionId(res.gameId);
						// owner already added; wait for game-start
					},
				);
			if (socket.connected) emitCreate();
			else socket.once("connect", emitCreate);
		},
		[socket],
	);

	const joinGame = useCallback(
		(gameId: string, playerName?: string) => {
			if (!socket) return;
			const emitJoin = () =>
				socket.emit("join-game", { gameId, playerName }, (res: any) => {
					console.log("join-game ack:", res);
					// server should emit game-start after adding
					setSessionId(gameId);
				});
			if (socket.connected) emitJoin();
			else socket.once("connect", emitJoin);
		},
		[socket],
	);

	const addChar = useCallback(
		(char: string) =>
			setCurrentGuess((guess) => (guess + char).slice(0, currentGameConfig.wordLength)),
		[],
	);
	const backspace = useCallback(
		() => setCurrentGuess((guess) => guess.slice(0, -1)),
		[],
	);

	const submitGuess = useCallback(() => {
		if (!socket || !sessionId || !playerId) return;
		if (!currentGuess || currentGuess.length === 0) return;
		socket.emit("submit-word", {
			gameId: sessionId,
			guess: currentGuess,
			playerId,
		});
	}, [socket, sessionId, playerId, currentGuess]);

	return {
		board: state?.board ?? [],
		states: state?.states ?? [],
		currentRow: state?.currentRow ?? 0,
		currentGuess,
		answer: state?.answer,
		currentGameConfig,
		connected,
		createGame,
		joinGame,
		addChar,
		backspace,
		submitGuess,
		setCurrentGameConfig,
		gameOver: state?.gameOver ?? false,
		lastResult: state?.lastResult ?? null,
		stats: undefined,
		letterStates: state?.letterStates,
		message: state?.message || null,
		clearMessage: () =>
			setState((s) => (s ? { ...s, message: undefined } : s)),
		// local shake flag that toggles on each invalid update
		boardShake,
	};
}
