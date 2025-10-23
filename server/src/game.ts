import crypto from "crypto";
import WORDS from "./words.json";

const isWord = require("is-word");
const ENGLISH_WORDS = isWord("american-english");

export type TileState = "absent" | "present" | "correct" | "empty";

// Use a fixed word pool for easier testing
// Can use a english dictionary package for a proper game
const TESTING_WORD_POOL = WORDS.words;

export type PlayerState = {
	id: string;
	name?: string;
	board: string[];
	states: TileState[][];
	currentRow: number;
	gameOver: boolean;
	lastResult: "win" | "lose" | null;
	guessesUsed: number | null;
};

export type GameConfig = {
	maxGuesses: number;
	wordLength: number;
	extraWordPool?: string[];
};

export type Game = {
	id: string;
	owner: string;
	answer: string; // solo mode default
	mode: "solo" | "duel";
	gameConfig: GameConfig;
	players: Map<string, PlayerState>;
	secrets: Map<string, string>; // providerId -> provided word
	answersForGuesser: Map<string, string>; // guesserId -> target
	finished: Set<string>;
	addPlayer: (id: string, name?: string) => PlayerState;
	getState: () => any;
	getPlayerState: (playerName: string) => any;
	setSecret: (playerName: string, word: string) => void;
	readyToStartDuel: () => boolean;
};

function pickAnswer(words: string[]) {
	if (!words || words.length === 0) return "apple";
	const idx = Math.floor(Math.random() * words.length);
	return words[idx].toLowerCase();
}

function checkGuess(guess: string, answer: string): TileState[] {
	const res: TileState[] = Array.from(
		{ length: guess.length },
		() => "absent",
	);
	const answerArr = answer.split("");
	const guessArr = guess.split("");

	// first pass correct
	guessArr.forEach((ch, i) => {
		if (answerArr[i] === ch) {
			res[i] = "correct";
			answerArr[i] = "";
		}
	});

	// second pass present
	guessArr.forEach((ch, i) => {
		if (res[i] === "correct") return;
		const idx = answerArr.indexOf(ch);
		if (idx !== -1) {
			res[i] = "present";
			answerArr[idx] = "";
		} else {
			res[i] = "absent";
		}
	});

	return res;
}

export function createGame(
	ownerId: string,
	gameConfig: GameConfig,
	playerName?: string,
): Game {
	const maxGuesses = gameConfig?.maxGuesses || 6;
	const wordLength = gameConfig?.wordLength || 5;
	const pool =
		gameConfig?.extraWordPool && gameConfig.extraWordPool.length
			? TESTING_WORD_POOL.concat(
					gameConfig.extraWordPool.map((w) => w.toLowerCase()),
				)
			: TESTING_WORD_POOL;
	const answer = pickAnswer(pool);
	const id = crypto.randomBytes(10).toString("hex");

	const players = new Map<string, PlayerState>();

	function makeEmptyBoard() {
		return Array.from({ length: maxGuesses }, () => "");
	}

	function makeEmptyStates() {
		return Array.from({ length: maxGuesses }, () =>
			Array.from({ length: wordLength }, () => "empty" as TileState),
		);
	}

	function addPlayer(id: string, name?: string) {
		const p: PlayerState = {
			id,
			name,
			board: makeEmptyBoard(),
			states: makeEmptyStates(),
			currentRow: 0,
			gameOver: false,
			lastResult: null,
			guessesUsed: null,
		};
		players.set(id, p);
		return p;
	}

	const g: Game = {
		id,
		owner: ownerId,
		answer,
		mode: "solo",
		gameConfig,
		players,
		secrets: new Map<string, string>(),
		answersForGuesser: new Map<string, string>(),
		finished: new Set<string>(),
		addPlayer,
		getState() {
			const playersState: any = {};
			players.forEach((player, pid) => {
				playersState[pid] = {
					board: player.board,
					states: player.states,
					currentRow: player.currentRow,
					gameOver: player.gameOver,
					lastResult: player.lastResult,
					guessesUsed: player.guessesUsed ?? undefined,
				};
			});
			return {
				id: g.id,
				maxGuesses: g.gameConfig.maxGuesses,
				wordLength: g.gameConfig.wordLength,
				extraWordPool: g.gameConfig.extraWordPool,
				players: playersState,
			};
		},
		getPlayerState(playerName: string) {
			const p = players.get(playerName);
			if (!p) return null;
			return {
				playerName,
				board: p.board,
				states: p.states,
				currentRow: p.currentRow,
				gameOver: p.gameOver,
				lastResult: p.lastResult,
				guessesUsed: p.guessesUsed ?? undefined,
				answer: p.gameOver
					? g.mode === "duel"
						? g.answersForGuesser.get(playerName)
						: g.answer
					: undefined,
			};
		},
		setSecret(playerName: string, word: string) {
			g.secrets.set(playerName, word.toLowerCase());
			if (g.secrets.size >= 2) {
				const ids = Array.from(g.players.keys());
				if (ids.length >= 2) {
					const [a, b] = ids;
					const wa = g.secrets.get(a);
					const wb = g.secrets.get(b);
					if (wa && wb) {
						g.answersForGuesser.set(a, wb);
						g.answersForGuesser.set(b, wa);
						g.mode = "duel";
					}
				}
			}
		},
		readyToStartDuel() {
			return g.mode === "duel" && g.answersForGuesser.size >= 2;
		},
	};

	// add owner as first player
	addPlayer(ownerId, playerName);

	return g;
}

export function handleGuess(game: Game, playerName: string, rawGuess: string) {
	const player = game.players.get(playerName);
	if (!player || player.gameOver) {
		console.log("invalid player or game over");
		return { error: "invalid player or game over" };
	}

	const guess = (rawGuess || "").trim().toLowerCase();
	if (guess.length !== game.gameConfig.wordLength) {
		console.log("Not enough letters");
		return { message: "Not enough letters", playerName };
	}

	if (!ENGLISH_WORDS.check(guess)) {
		console.log("not in word list");
		return { message: "Not in word list", playerName };
	}

	const targetAnswer =
		game.mode === "duel"
			? game.answersForGuesser.get(playerName) || game.answer
			: game.answer;

	player.board[player.currentRow] = guess;
	const rowStates = checkGuess(guess, targetAnswer);
	player.states[player.currentRow] = rowStates;

	const isWin = rowStates.every((s) => s === "correct");
	const nextRow = player.currentRow + 1;

	if (isWin) {
		player.gameOver = true;
		player.lastResult = "win";
		player.guessesUsed = nextRow;
		game.finished.add(playerName);
	} else if (nextRow >= game.gameConfig.maxGuesses) {
		player.gameOver = true;
		player.lastResult = "lose";
		game.finished.add(playerName);
	} else {
		player.currentRow = nextRow;
	}

	const letterStates: Record<string, TileState> = {};
	for (let r = 0; r < game.gameConfig.maxGuesses; r++) {
		const word = player.board[r];
		const stRow = player.states[r];
		if (!word) continue;
		for (let i = 0; i < stRow.length; i++) {
			const ch = word[i];
			const st = stRow[i];
			const prev = letterStates[ch];
			if (st === "correct") letterStates[ch] = "correct";
			else if (st === "present") {
				if (prev !== "correct" && prev !== "present")
					letterStates[ch] = "present";
			} else {
				if (!prev) letterStates[ch] = st;
			}
		}
	}

	return {
		playerName,
		board: player.board,
		states: player.states,
		currentRow: player.currentRow,
		gameOver: player.gameOver,
		lastResult: player.lastResult,
		letterStates,
		guessesUsed:
			player.gameOver && player.lastResult === "win"
				? (player.guessesUsed ?? undefined)
				: undefined,
		answer: player.gameOver ? targetAnswer : undefined,
	};
}
