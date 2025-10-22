import { useState } from "react";
import SettingsIcon from "@mui/icons-material/Settings";

import { GameConfig, useGame } from "./hooks/game";
import { Board } from "./components/Board/Board";
import { Keyboard } from "./components/Keyboard/Keyboard";
import { Settings } from "./components/Settings/Settings";
import { Stats } from "./components/Stats";
import { GameStartOverlay } from "./components/GameStartDialog";
import { GameOverDialog } from "./components/GameOverDialog";
import { Snackbar } from "@mui/material";

export default function App() {
	const game = useGame();
	const [startOpen, setStartOpen] = useState(true);
	const [startConfigOpen, setStartConfigOpen] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [selectedMode, setSelectedMode] = useState<"single" | "multi" | null>(
		null,
	);

	const handleSelectMode = (mode: "single" | "multi") => {
		setSelectedMode(mode);
		setStartOpen(false);
		setStartConfigOpen(true);
	};

	const handleStartGame = (config: GameConfig) => {
		game.createGame(config, "Player");
		setStartConfigOpen(false);
	};

	return (
		<div className="app">
			<GameStartOverlay
				open={startOpen}
				onSelect={handleSelectMode}
				onClose={() => setStartOpen(false)}
			/>
			<Settings
				open={startConfigOpen}
				currentSettings={game.currentGameConfig}
				setLocalSettings={game.setCurrentGameConfig}
				submitSettingsToGame={handleStartGame}
				onClose={() => {
					setStartConfigOpen(false);
					setStartOpen(true);
				}}
				primaryLabel="Start Game"
				secondaryLabel="Back"
			/>
			<div style={{ position: "relative" }}>
				<h1>Wordle Clone</h1>
				<button
					className="settings-button"
					onClick={() => setShowSettings(true)}
					aria-label="Open settings"
				>
					<SettingsIcon fontSize="small" />
				</button>
			</div>
			<Board
				board={game.board}
				states={game.states}
				currentRow={game.currentRow}
				currentGuess={game.currentGuess}
				wordLength={game.currentGameConfig.wordLength}
				maxGuesses={game.currentGameConfig.maxGuesses}
				shake={game.boardShake}
			/>
			<Keyboard
				addChar={game.addChar}
				backspace={game.backspace}
				submitGuess={game.submitGuess}
				letterStates={game.letterStates}
				gamePaused={startOpen || showSettings || game.gameOver}
			/>
			{/* Player game tracking stats, can be implemented if database is setup*/}
			{/* <Stats stats={game.stats} /> */}
			<GameOverDialog
				open={game.gameOver}
				lastResult={game.lastResult}
				answer={game.answer}
				guessesUsed={game.currentRow + 1}
				handlePlayAgain={() => handleStartGame(game.currentGameConfig)}
			/>
			<Settings
				open={showSettings}
				currentSettings={game.currentGameConfig}
				setLocalSettings={game.setCurrentGameConfig}
				submitSettingsToGame={handleStartGame}
				onClose={() => setShowSettings(false)}
			/>

			<Snackbar
				open={!!game.message}
				message={game.message}
				onClose={game.clearMessage}
				autoHideDuration={5000}
			/>
		</div>
	);
}
