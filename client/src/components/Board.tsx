import React from "react";
import { TileState } from "../hooks/game";

type BoardProps = {
	board: string[];
	states: TileState[][];
	currentRow: number;
	currentGuess: string;
	wordLength: number;
	maxGuesses: number;
	shake?: boolean;
};

export function Board({
	board,
	states,
	currentRow,
	currentGuess,
	wordLength,
	maxGuesses,
	shake,
}: BoardProps) {

	const rows = Array.from({ length: maxGuesses }, (_, r) => {
		const rowWord = r === currentRow ? currentGuess : board[r] || "";
		const rowStates: TileState[] | undefined = states[r];
		const revealed = !!(
			rowStates && rowStates.some((s: TileState) => s !== "empty")
		);

		const rowClass = ["row"];
		if (r === currentRow && shake) rowClass.push("shake");

		return (
			<div key={r} className={rowClass.join(" ")}>
				{Array.from({ length: wordLength }, (_, i) => {
					const ch = ((rowWord && rowWord[i]) || "").toUpperCase();
					const st: TileState = rowStates ? rowStates[i] : "empty";
					const classes = ["tile", st];
					const style: React.CSSProperties = {};
					if (revealed) {
						classes.push("flip");
						// stagger by column index: 150ms per tile
						style.transitionDelay = `${i * 150}ms`;
					}
					return (
						<div
							key={i}
							className={classes.join(" ")}
							style={style}
						>
							{ch}
						</div>
					);
				})}
			</div>
		);
	});

	return <div className="board">{rows}</div>;
}
