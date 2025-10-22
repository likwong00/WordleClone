import React from "react";
import { TileState } from "../../hooks/game";

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
	const rows = Array.from({ length: maxGuesses }, (_, rowIndex) => {
		const rowWord =
			rowIndex === currentRow ? currentGuess : board[rowIndex] || "";
		const rowStates: TileState[] | undefined = states[rowIndex];
		const revealed = !!(
			rowStates && rowStates.some((state: TileState) => state !== "empty")
		);

		const rowClass = ["row"];
		if (rowIndex === currentRow && shake) rowClass.push("shake");

		return (
			<div key={rowIndex} className={rowClass.join(" ")}>
				{Array.from({ length: wordLength }, (_, letterIndex) => {
					const char = (
						(rowWord && rowWord[letterIndex]) ||
						""
					).toUpperCase();
					const state: TileState = rowStates
						? rowStates[letterIndex]
						: "empty";
					const classes = ["tile", state];
					const style: React.CSSProperties = {};
					if (revealed) {
						classes.push("flip");
						// stagger by column index: 150ms per tile to get each
						// letter flipped one after another
						style.transitionDelay = `${letterIndex * 150}ms`;
					}
					return (
						<div
							key={letterIndex}
							className={classes.join(" ")}
							style={style}
						>
							{char}
						</div>
					);
				})}
			</div>
		);
	});

	return <div className="board">{rows}</div>;
}
