import { useEffect, useState, useCallback, useRef } from "react";
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
};

const DEFAULT_GAME_CONFIG: GameConfig = {
	maxGuesses: 6,
	wordLength: 5,
};

export function useGame() {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [playerName, setPlayerName] = useState<string>("Player");
	const playerNameRef = useRef<string>("Player");
	const [state, setState] = useState<ServerState | null>(null);
	const [currentGameConfig, setCurrentGameConfig] =
		useState<GameConfig>(DEFAULT_GAME_CONFIG);
	const [connected, setConnected] = useState(false);
	const [currentGuess, setCurrentGuess] = useState("");
	const [boardShake, setBoardShake] = useState(false);
	const [duelStatus, setDuelStatus] = useState<
		"idle" | "waiting" | "need-secret" | "in-progress" | "complete"
	>("idle");
	const [duelResult, setDuelResult] = useState<{
		winner: string | null;
		results: {
			id: string;
			lastResult: string | null;
			guessesUsed?: number | null;
		}[];
	} | null>(null);

	useEffect(() => {
		const s = io("http://localhost:4000");
		setSocket(s);
		s.on("connect", () => {
			setConnected(true);
		});
		s.on("game-start", (state: ServerState) => {
			console.log("socket game-start:", state);
			setState(state);
			setDuelStatus("in-progress");
			setCurrentGuess("");
		});

		s.on(
			"duel-waiting",
			(payload: { gameId: string; gameConfig: GameConfig }) => {
				console.log("socket duel-waiting:", payload);
				setSessionId(payload.gameId);
				setCurrentGameConfig(payload.gameConfig);
				setDuelStatus("waiting");
			},
		);

		s.on(
			"duel-need-secret",
			(payload: { gameId: string; gameConfig: GameConfig }) => {
				console.log("socket duel-need-secret:", payload);
				setSessionId(payload.gameId);
				setCurrentGameConfig(payload.gameConfig);
				setDuelStatus("need-secret");
			},
		);

		s.on(
			"duel-result",
			(payload: {
				winner: string | null;
				results: {
					id: string;
					lastResult: string | null;
					guessesUsed?: number | null;
				}[];
			}) => {
				console.log("socket duel-result:", payload);
				setDuelResult(payload);
				setDuelStatus("complete");
			},
		);
		s.on("game-update", (incoming: any) => {
			console.log("socket game-update:", incoming);
			// Ignore updates that belong to another player in multiplayer rooms
			if (
				incoming &&
				incoming.playerName &&
				playerName &&
				incoming.playerName !== playerNameRef.current
			) {
				return;
			}
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
					setBoardShake(true);
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

	// Local effect to reset boardShake after a short delay
	useEffect(() => {
		setTimeout(() => setBoardShake(false), 300);
		console.log("boardShake effect triggered")
	}, [boardShake]);

	// There's a bug where playerName state is not being updated properly
	// Use a ref to keep the latest value for socket handlers
	useEffect(() => {
		playerNameRef.current = playerName;
	}, [playerName]);

	const createGame = useCallback(
		(gameconfig: GameConfig, name?: string) => {
			if (!socket) return;
			if (name) setPlayerName(name);
			const emitCreate = () =>
				socket.emit("create-game", name, gameconfig, (res: any) => {
					console.log("create-game ack:", res);
					if (res?.gameId) setSessionId(res.gameId);
					// owner already added; wait for game-start
				});
			if (socket.connected) emitCreate();
			else socket.once("connect", emitCreate);
		},
		[socket],
	);

	const createDuel = useCallback(
		(gameconfig: GameConfig, name: string, secretWord: string) => {
			if (!socket) return;
			setPlayerName(name);
			const emitCreate = () =>
				socket.emit(
					"create-duel",
					name,
					gameconfig,
					secretWord,
					(res: any) => {
						console.log("create-duel ack:", res);
						if (res?.gameId) setSessionId(res.gameId);
						setDuelStatus("waiting");
					},
				);
			if (socket.connected) emitCreate();
			else socket.once("connect", emitCreate);
		},
		[socket],
	);

	const joinGame = useCallback(
		(gameId: string, name: string) => {
			if (!socket) return;
			setPlayerName(name);
			const emitJoin = () =>
				socket.emit(
					"join-game",
					{ gameId, playerName: name },
					(res: any) => {
						console.log("join-game ack:", res);
						// server should emit game-start after adding
						setSessionId(gameId);
					},
				);
			if (socket.connected) emitJoin();
			else socket.once("connect", emitJoin);
		},
		[socket],
	);

	const joinDuel = useCallback(
		(gameId: string, name: string) => {
			if (!socket) return;
			setPlayerName(name);
			const emitJoin = () =>
				socket.emit(
					"join-duel",
					{ gameId, playerName: name },
					(res: any) => {
						console.log("join-duel ack:", res);
						setSessionId(gameId);
					},
				);
			if (socket.connected) emitJoin();
			else socket.once("connect", emitJoin);
		},
		[socket],
	);

	const addChar = useCallback(
		(char: string) =>
			setCurrentGuess((guess) =>
				(guess + char).slice(0, currentGameConfig.wordLength),
			),
		[],
	);
	const backspace = useCallback(
		() => setCurrentGuess((guess) => guess.slice(0, -1)),
		[],
	);

	const submitGuess = useCallback(() => {
		if (!socket || !sessionId || !playerNameRef.current) return;
		if (!currentGuess || currentGuess.length === 0) return;
		socket.emit("submit-word", {
			gameId: sessionId,
			guess: currentGuess,
			playerName: playerNameRef.current,
		});
	}, [socket, sessionId, currentGuess]);

	const submitSecret = useCallback(
		(secretWord: string) => {
			if (!socket || !sessionId) return;
			socket.emit(
				"submit-secret",
				{
					gameId: sessionId,
					secretWord,
					playerName: playerNameRef.current,
				},
				(res: any) => {
					console.log("submit-secret ack:", res);
					if (res?.error) {
						setState((s) => (s ? { ...s, message: res.error } : s));
					}
				},
			);
		},
		[socket, sessionId],
	);

	return {
		board: state?.board ?? [],
		states: state?.states ?? [],
		currentRow: state?.currentRow ?? 0,
		currentGuess,
		answer: state?.answer,
		currentGameConfig,
		connected,
		sessionId,
		createGame,
		createDuel,
		joinGame,
		joinDuel,
		addChar,
		backspace,
		submitGuess,
		submitSecret,
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
		duelStatus,
		duelResult,
		playerName: playerNameRef.current,
	};
}
