import crypto from "crypto";
import WORDS from "./words.json";

const isWord = require('is-word');
const ENGLISH_WORDS = isWord('american-english');

export type TileState = "absent" | "present" | "correct" | "empty";

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

type PlayerState = {
	id: string;
	name?: string;
	board: string[];
	states: TileState[][];
	currentRow: number;
	gameOver: boolean;
	lastResult: "win" | "lose" | null;
};

type Game = {
	id: string;
	owner: string;
	answer: string;
	maxGuesses: number;
	wordLength: number;
	players: Map<string, PlayerState>;
	addPlayer: (id: string, name?: string) => PlayerState;
	getState: () => any;
};

const ALLOWED = WORDS.words.map((w: string) => w.toLowerCase());

export function createGame(
	ownerId: string,
	playerName?: string,
	opts?: { maxGuesses?: number; wordLength?: number; wordsPool?: string[] },
): Game {
	const maxGuesses = opts?.maxGuesses || 6;
	const wordLength = opts?.wordLength || 5;
	const pool =
		opts?.wordsPool && opts.wordsPool.length
			? opts.wordsPool.map((w) => w.toLowerCase())
			: ALLOWED;
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
		};
		players.set(id, p);
		return p;
	}

	const g: Game = {
		id,
		owner: ownerId,
		answer,
		maxGuesses,
		wordLength,
		players,
		addPlayer,
		getState() {
			const playersState: any = {};
			players.forEach((p, pid) => {
				playersState[pid] = {
					board: p.board,
					states: p.states,
					currentRow: p.currentRow,
					gameOver: p.gameOver,
					lastResult: p.lastResult,
				};
			});
			return {
				id: g.id,
				maxGuesses: g.maxGuesses,
				wordLength: g.wordLength,
				players: playersState,
			};
		},
	};

	// add owner as first player
	addPlayer(ownerId, playerName);

	return g;
}

export function handleGuess(game: Game, playerId: string, rawGuess: string) {
	const player = game.players.get(playerId);
	if (!player || player.gameOver) {
        console.log("invalid player or game over");
        return { error: "invalid player or game over" };
    }

	const guess = (rawGuess || "").trim().toLowerCase();
	if (guess.length !== game.wordLength) {
        console.log("Not enough letters");
        return { message: "Not enough letters", playerId };
    } 

	// validate against allowed list
	if (!ENGLISH_WORDS.check(guess)) {
        console.log("not in word list");
		return { message: "Not in word list", playerId };
	}

	// apply guess
	player.board[player.currentRow] = guess;
	const rowStates = checkGuess(guess, game.answer);
	player.states[player.currentRow] = rowStates;

	const isWin = rowStates.every((s) => s === "correct");
	const nextRow = player.currentRow + 1;

	if (isWin) {
		player.gameOver = true;
		player.lastResult = "win";
	} else if (nextRow >= game.maxGuesses) {
		player.gameOver = true;
		player.lastResult = "lose";
	} else {
		player.currentRow = nextRow;
	}

	// compute letterStates for this player's revealed info
	const letterStates: Record<string, TileState> = {};
	for (let r = 0; r < game.maxGuesses; r++) {
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
		playerId,
		board: player.board,
		states: player.states,
		currentRow: player.currentRow,
		gameOver: player.gameOver,
		lastResult: player.lastResult,
		letterStates,
		answer: player.gameOver ? game.answer : undefined, // send answer only when player finished
	};
}
