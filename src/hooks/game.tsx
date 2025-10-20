import { useState, useCallback, useEffect, useRef } from "react";
import { isEnglish } from "check-english";

import WORDS from "../words.json";

export type TileState = "absent" | "present" | "correct" | "empty";

export function pickAnswer(words: string[], seed?: number) {
	if (!words || words.length === 0) return "apple";
	const idx = Math.floor(Math.random() * words.length);
	return words[idx].toLowerCase();
}

export function checkGuess(guess: string, answer: string) {
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

type UseGame = {
	board: string[];
	states: TileState[][];
	currentRow: number;
	currentGuess: string;
	answer: string;
	maxGuesses: number;
	wordLength: number;
	submitGuess: () => void;
	addChar: (char: string) => void;
	backspace: () => void;
	reset: () => void;
	setConfig: (opts: { maxGuesses?: number; words?: string[] }) => void;
	gameOver?: boolean;
	lastResult?: "win" | "lose" | null;
	stats?: any;
	letterStates?: Record<string, TileState>;
	guessesUsed?: number | null;
	message?: string | null;
	clearMessage?: () => void;
	shake?: boolean;
};

export function useGame(): UseGame {
	const defaultWords = WORDS.words.map((w: string) => w.toLowerCase());
	const [maxGuesses, setMaxGuesses] = useState(6);
	const [wordList, setWordList] = useState<string[]>(defaultWords);
	const [answer, setAnswer] = useState<string>(() =>
		pickAnswer(defaultWords),
	);
	const [wordLength] = useState(5);
	const [board, setBoard] = useState<string[]>(() =>
		Array.from({ length: maxGuesses }, () => ""),
	);
	const [states, setStates] = useState<TileState[][]>(() =>
		Array.from({ length: maxGuesses }, () =>
			Array.from({ length: wordLength }, () => "empty" as TileState),
		),
	);
	const [currentRow, setCurrentRow] = useState(0);
	const [currentGuess, setCurrentGuess] = useState("");
	const [gameOver, setGameOver] = useState(false);
	const [lastResult, setLastResult] = useState<"win" | "lose" | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [shake, setShake] = useState(false);
	const shakeTimeout = useRef<number | null>(null);

	// Stats persisted separately
	const [stats, setStats] = useState(() => {
		try {
			const raw = localStorage.getItem("wordle-clone-stats");
			if (raw) return JSON.parse(raw);
		} catch (e) {}
		return { played: 0, wins: 0, currentStreak: 0, maxStreak: 0 };
	});

	// Attempt to load persisted game state on mount
	useEffect(() => {
		try {
			const raw = localStorage.getItem("wordle-clone-state");
			if (raw) {
				const obj = JSON.parse(raw);
				if (obj && obj.board && obj.states) {
					setMaxGuesses(obj.maxGuesses || 6);
					setWordList(obj.wordList || defaultWords);
					setAnswer(obj.answer || pickAnswer(defaultWords));
					setBoard(obj.board);
					setStates(obj.states);
					setCurrentRow(obj.currentRow || 0);
					setCurrentGuess(obj.currentGuess || "");
					setGameOver(!!obj.gameOver);
					setLastResult(obj.lastResult || null);
				}
			}
		} catch (e) {
			// ignore
		}
	}, []);

	// cleanup any pending timeouts on unmount
	useEffect(() => {
		return () => {
			if (shakeTimeout.current) window.clearTimeout(shakeTimeout.current);
		};
	}, []);

	// Save state helper
	const saveState = useCallback(
		(next?: Partial<Record<string, any>>) => {
			try {
				const payload = {
					board,
					states,
					currentRow,
					currentGuess,
					answer,
					maxGuesses,
					wordList,
					gameOver,
					lastResult,
					...next,
				};
				localStorage.setItem(
					"wordle-clone-state",
					JSON.stringify(payload),
				);
			} catch (e) {}
		},
		[
			board,
			states,
			currentRow,
			currentGuess,
			answer,
			maxGuesses,
			wordList,
			gameOver,
			lastResult,
		],
	);

	// compute letter states (best state per letter) from revealed rows
	const letterStates = (() => {
		const map: Record<string, TileState> = {};
		for (let r = 0; r < states.length; r++) {
			const rowStates = states[r];
			const word = board[r];
			if (!rowStates || !word) continue;
			for (let i = 0; i < rowStates.length; i++) {
				const ch = word[i];
				const st = rowStates[i];
				if (!ch) continue;
				const prev = map[ch];
				// priority: correct > present > absent
				if (st === "correct") {
					map[ch] = "correct";
				} else if (st === "present") {
					if (prev !== "correct" && prev !== "present")
						map[ch] = "present";
				} else {
					if (!prev) map[ch] = st;
				}
			}
		}
		return map;
	})();

	const [guessesUsed, setGuessesUsed] = useState<number | null>(null);

	const reset = useCallback(() => {
		const nextAnswer = pickAnswer(wordList);
		setAnswer(nextAnswer);
		const emptyBoard = Array.from({ length: maxGuesses }, () => "");
		const emptyStates = Array.from({ length: maxGuesses }, () =>
			Array.from({ length: wordLength }, () => "empty" as TileState),
		);
		setBoard(emptyBoard);
		setStates(emptyStates);
		setCurrentRow(0);
		setCurrentGuess("");
		setGameOver(false);
		setLastResult(null);
		saveState({
			answer: nextAnswer,
			board: emptyBoard,
			states: emptyStates,
			currentRow: 0,
			currentGuess: "",
			gameOver: false,
			lastResult: null,
		});
	}, [maxGuesses, wordList, wordLength]);

	const submitGuess = useCallback(() => {
		if (currentGuess.length !== wordLength) return;
		const guessLower = currentGuess.toLowerCase();
		let allowed = wordList.includes(guessLower) || isEnglish(guessLower);
		if (!allowed) {
			setMessage("Not in word list");
			setShake(true);
			// clear any existing timeout
			if (shakeTimeout.current) {
				window.clearTimeout(shakeTimeout.current);
			}
			shakeTimeout.current = window.setTimeout(() => {
				setShake(false);
				shakeTimeout.current = null;
			}, 600);
			setCurrentGuess("");
			return;
		}
		const newBoard = [...board];
		newBoard[currentRow] = currentGuess;
		const newStates = [...states];
		newStates[currentRow] = checkGuess(currentGuess, answer);
		setBoard(newBoard);
		setStates(newStates);
		const nextRow = currentRow + 1;
		setCurrentRow(nextRow);
		setCurrentGuess("");

		// check win/lose
		const isWin = newStates[currentRow].every((s) => s === "correct");
		if (isWin) {
			setGameOver(true);
			setLastResult("win");
			setGuessesUsed(nextRow + 0); // nextRow is index after submission; guesses used = nextRow
			// update stats
			setStats((st: any) => {
				const played = (st.played || 0) + 1;
				const wins = (st.wins || 0) + 1;
				const currentStreak = (st.currentStreak || 0) + 1;
				const maxStreak = Math.max(st.maxStreak || 0, currentStreak);
				const next = { ...st, played, wins, currentStreak, maxStreak };
				try {
					localStorage.setItem(
						"wordle-clone-stats",
						JSON.stringify(next),
					);
				} catch (e) {}
				return next;
			});
			saveState({
				board: newBoard,
				states: newStates,
				currentRow: nextRow,
				currentGuess: "",
				gameOver: true,
				lastResult: "win",
			});
			return;
		}

		if (nextRow >= maxGuesses) {
			setGameOver(true);
			setLastResult("lose");
			setStats((st: any) => {
				const played = (st.played || 0) + 1;
				const wins = st.wins || 0;
				const currentStreak = 0;
				const maxStreak = st.maxStreak || 0;
				const next = { ...st, played, wins, currentStreak, maxStreak };
				try {
					localStorage.setItem(
						"wordle-clone-stats",
						JSON.stringify(next),
					);
				} catch (e) {}
				return next;
			});
			saveState({
				board: newBoard,
				states: newStates,
				currentRow: nextRow,
				currentGuess: "",
				gameOver: true,
				lastResult: "lose",
			});
			return;
		}

		saveState({
			board: newBoard,
			states: newStates,
			currentRow: nextRow,
			currentGuess: "",
		});
	}, [board, states, currentGuess, currentRow, answer, wordLength]);

	const addChar = useCallback(
		(c: string) => {
			if (currentGuess.length >= wordLength) return;
			setCurrentGuess((g) => g + c);
		},
		[wordLength],
	);

	const backspace = useCallback(() => {
		setCurrentGuess((g) => g.slice(0, -1));
	}, []);

	const setConfig = useCallback(
		(opts: { maxGuesses?: number; words?: string[] }) => {
			if (opts.maxGuesses) setMaxGuesses(opts.maxGuesses);
			if (opts.words) setWordList(opts.words.map((w) => w.toLowerCase()));
			// persist new config
			saveState({
				maxGuesses: opts.maxGuesses,
				wordList: opts.words
					? opts.words.map((w) => w.toLowerCase())
					: undefined,
			});
		},
		[],
	);

	const clearMessage = useCallback(() => setMessage(null), []);

	return {
		board,
		states,
		currentRow,
		currentGuess,
		answer,
		maxGuesses,
		wordLength,
		submitGuess,
		addChar,
		backspace,
		reset,
		setConfig,
		gameOver,
		lastResult,
		stats,
		letterStates,
		guessesUsed,
		message,
		clearMessage,
		shake,
	};
}
