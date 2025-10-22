import { useState } from "react";
import { Button, Dialog, DialogContent, Slider } from "@mui/material";

import { GameConfig } from "../../hooks/game";

type SettingsProps = {
	open: boolean;
	currentSettings: GameConfig;
	setLocalSettings: (gameConfig: GameConfig) => void;
	submitSettingsToGame: (gameConfig: GameConfig) => void;
	onClose?: () => void;
	primaryLabel?: string;
	secondaryLabel?: string;
};

function wordSplit(wordListText: string): string[] {
	return wordListText
		.split(/\s*,\s*/)
		.map((word) => word.trim())
		.filter((word) => word.length > 0);
}

function validateWordList(wordList: string[], wordLength: number): boolean {
	return wordList.every(
		(word) => typeof word === "string" && word.length === wordLength,
	);
}

export function Settings({
	open,
	currentSettings,
	setLocalSettings,
	submitSettingsToGame,
	onClose,
	primaryLabel = "Apply",
	secondaryLabel = "Close",
}: SettingsProps) {
	const [maxGuesses, setMaxGuesses] = useState<number>(
		currentSettings.maxGuesses,
	);
	const [wordLength, setWordLength] = useState<number>(
		currentSettings.wordLength,
	);
	const [wordText, setWordText] = useState<string>("");

	function apply() {
		const words = wordSplit(wordText);
		const newSettings: GameConfig = {
			maxGuesses,
			wordLength,
			extraWordPool: words.length ? words : undefined,
		};
		console.log("Applying settings:", newSettings);
		setLocalSettings(newSettings);
		submitSettingsToGame(newSettings);
		if (onClose && primaryLabel === "Apply") onClose();
	}

	const isValidWordListInput = validateWordList(
		wordSplit(wordText),
		wordLength,
	);

	return (
		<Dialog
			open={open}
			onClose={(_, reason) => {
				// Prevent closing via backdrop/Escape; use Back button instead
				if (reason === "backdropClick") return;
			}}
			disableEscapeKeyDown
			aria-labelledby="game-config-title"
		>
			<DialogContent dividers>
				<div className="settings">
					<h2>Settings</h2>
					<label htmlFor="max-guesses-slider">
						Max guesses: {maxGuesses}
					</label>
					<Slider
						aria-label="Max guesses"
						id="max-guesses-slider"
						min={3}
						max={10}
						step={1}
						value={maxGuesses}
						valueLabelDisplay="auto"
						onChange={(_, value) => {
							if (typeof value === "number") setMaxGuesses(value);
						}}
					/>

					<label htmlFor="word-length-slider">
						Word length: {wordLength}
					</label>
					<Slider
						aria-label="Word length"
						id="word-length-slider"
						min={2}
						max={10}
						step={1}
						value={wordLength}
						valueLabelDisplay="auto"
						onChange={(_, value) => {
							if (typeof value === "number") setWordLength(value);
						}}
					/>

					<label>
						Additional words (comma separated):{" "}
						<input
							aria-label="Additional words"
							value={wordText}
							onChange={(e) => setWordText(e.target.value)}
						/>
					</label>

					<div
						style={{
							display: "flex",
							gap: 8,
							alignItems: "center",
						}}
					>
						<Button
							variant="outlined"
							onClick={apply}
							disabled={!isValidWordListInput}
							aria-disabled={!isValidWordListInput}
						>
							{primaryLabel}
						</Button>
						<Button
							variant="outlined"
							onClick={() => onClose && onClose()}
						>
							{secondaryLabel}
						</Button>
						{!isValidWordListInput && (
							<div className="error-alert" role="alert">
								Please enter a list of words with the correct
								length
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
