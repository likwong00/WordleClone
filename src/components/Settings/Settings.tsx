import { useState } from "react";

type SettingsProps = {
	maxGuesses: number;
	setConfig: (opts: { maxGuesses?: number; words?: string[] }) => void;
	reset: () => void;
	onClose?: () => void;
};

export function Settings({ maxGuesses, setConfig, reset, onClose }: SettingsProps) {
	// keep as string so clearing the input doesn't coerce to 0
	const [max, setMax] = useState(String(maxGuesses || 6));
	const [wordText, setWordText] = useState("");
	const [touched, setTouched] = useState(false);

	function apply() {
		const words = wordText.split(/\s*,\s*/).filter(Boolean);
		let parsedMax = Number(max);
		if (Number.isNaN(parsedMax) || parsedMax < 1) parsedMax = 1;
		if (parsedMax > 10) parsedMax = 10;
		setConfig({
			maxGuesses: parsedMax,
			words: words.length ? words : undefined,
		});
		reset();
		if (onClose) onClose();
	}

	const parsed = Number(max);
	const isValid = !Number.isNaN(parsed) && parsed >= 1 && parsed <= 100;

	return (
		<div className="settings">
			<h2>Settings</h2>
			<label>
				Max guesses:{" "}
				<input
					type="number"
					value={max}
					min={1}
					max={100}
					onChange={(e) => {
						setTouched(true);
						setMax(e.target.value);
					}}
				/>
			</label>
			<label>
				Additional words (comma separated):{" "}
				<input
					value={wordText}
					onChange={(e) => setWordText(e.target.value)}
				/>
			</label>
			<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
				<button onClick={apply} disabled={!isValid} aria-disabled={!isValid}>
					Apply
				</button>
				<button onClick={() => onClose && onClose()}>Close</button>
				{!isValid && touched && (
					<div style={{ color: '#f66', marginLeft: 8 }} role="alert">
						Please enter a number between 1 and 10
					</div>
				)}
			</div>
		</div>
	);
}
