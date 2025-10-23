import { Game, PlayerState } from "../game";

// Map gameId -> (playerName -> socketId)
const gameSockets = new Map<string, Map<string, string>>();

export function mapPlayerSocket(
	gameId: string,
	playerName: string,
	socketId: string,
) {
	let m = gameSockets.get(gameId);
	if (!m) {
		m = new Map<string, string>();
		gameSockets.set(gameId, m);
	}
	m.set(playerName, socketId);
}

export function getSocketIdFor(
	gameId: string,
	playerName: string,
): string | undefined {
	return gameSockets.get(gameId)?.get(playerName);
}

export function selectWinner(a: PlayerState, b: PlayerState): string | null {
	if (a.guessesUsed === b.guessesUsed) return null;
	return (a.guessesUsed ?? 11) < (b.guessesUsed ?? 11) ? a.id : b.id;
}

// Determine duel outcome when both players have finished.
// Logic to decide winner:
// 	- If both players win, the one with fewer guessesUsed wins; if tied, it's a draw (null).
// 	- If only one player wins, that player is the winner.
// 	- If both players runs out of guesses, it's a draw (null).
// Returns null if the duel isn't complete yet.
export function determineDuelOutcome(
	game: Game,
): {
	winner: string | null;
	results: {
		id: string;
		lastResult: string | null;
		guessesUsed: number | null;
	}[];
} | null {
	if (game.mode !== "duel" || game.finished.size < 2) return null;
	const players = Array.from(game.players.values());
	const [a, b] = players;
	let winner: string | null = null;
	if (a.lastResult === "win" && b.lastResult === "win") {
		winner = selectWinner(a, b);
	} else if (a.lastResult === "win" && b.lastResult !== "win") winner = a.id;
	else if (b.lastResult === "win" && a.lastResult !== "win") winner = b.id;
	else winner = null; // both lost = draw

	return {
		winner,
		results: players.map((p) => ({
			id: p.id,
			lastResult: p.lastResult,
			guessesUsed: p.guessesUsed ?? null,
		})),
	};
}
