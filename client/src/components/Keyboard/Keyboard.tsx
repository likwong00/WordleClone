import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";

import { TileState } from "../../hooks/useGame";
import { useEffect } from "react";

const ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

type KeyboardProps = {
	addChar: (char: string) => void;
	backspace: () => void;
	submitGuess: () => void;
	letterStates?: Record<string, TileState>;
	gamePaused?: boolean;
};

export function Keyboard({
	addChar,
	backspace,
	submitGuess,
	letterStates,
	gamePaused,
}: KeyboardProps) {
	function keyOnClick(letter: string) {
		addChar(letter.toLowerCase());
	}

	const renderKey = (letter: string) => {
		const stateClass = letterStates
			? letterStates[letter.toLowerCase()]
			: undefined;
		const className = `letter-button ${stateClass ?? ""}`.trim();
		return (
			<button
				key={letter}
				onClick={() => keyOnClick(letter)}
				className={className}
			>
				{letter}
			</button>
		);
	};

	const renderRow = (row: string) => (
		<div key={row} className="keyboard-row">
			{Array.from(row).map((letter) => renderKey(letter))}
		</div>
	);

	// physical keyboard handling
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (gamePaused) return;
			const key = e.key;
			if (key === "Enter") {
				e.preventDefault();
				submitGuess();
			}
			if (key === "Backspace") {
				e.preventDefault();
				backspace();
			}
			if (/^[a-zA-Z]$/.test(key)) return addChar(key.toLowerCase());
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [addChar, backspace, submitGuess, gamePaused]);

	return (
		<div className="keyboard" data-testid="keyboard-root">
			{ROWS.slice(0, 2).map((r) => renderRow(r))}

			{/* Last row: Enter on the left, letters, Backspace icon on the right */}
			<div className="keyboard-row">
				<button
					className="key-wide"
					onClick={submitGuess}
					aria-label="Enter"
				>
					ENTER
				</button>

				{Array.from(ROWS[2]).map((letter) => renderKey(letter))}

				<button
					className="key-wide"
					onClick={backspace}
					aria-label="Backspace"
				>
					<BackspaceOutlinedIcon />
				</button>
			</div>
		</div>
	);
}

export default Keyboard;
