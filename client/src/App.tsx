import { useEffect, useState } from "react";
import SettingsIcon from "@mui/icons-material/Settings";

import { GameConfig, useGame } from "./hooks/useGame";
import { Board } from "./components/Board/Board";
import { Keyboard } from "./components/Keyboard/Keyboard";
import { Settings } from "./components/Settings/Settings";
import { Stats } from "./components/Stats";
import { GameStartDialog } from "./components/SinglePlayer/GameStartDialog";
import { GameOverDialog } from "./components/SinglePlayer/GameOverDialog";
import { Snackbar } from "@mui/material";
import { DuelDialog } from "./components/Duel/DuelDialog";
import { DuelResultDialog } from "./components/Duel/DuelResultDialog";

export default function App() {
	const game = useGame();
	const [startOpen, setStartOpen] = useState(true);
	const [startConfigOpen, setStartConfigOpen] = useState(false);
	const [duelOpen, setDuelOpen] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [selectedMode, setSelectedMode] = useState<"single" | "multi" | null>(
		null,
	);

	const handleSelectMode = (mode: "single" | "multi") => {
		setSelectedMode(mode);
		setStartOpen(false);
		if (mode === "single") setStartConfigOpen(true);
		else setDuelOpen(true);
		console.log(mode);
	};

	const handleStartGame = (config: GameConfig) => {
		game.createGame(config, "Player");
		setStartConfigOpen(false);
	};

	// Failsafe: if multiplayer selected and start dialog is closed, ensure Duel dialog opens
	useEffect(() => {
		if (!startOpen && selectedMode === "multi") {
			setDuelOpen(true);
		}
	}, [startOpen, selectedMode]);

	return (
		<div className="app">
			<GameStartDialog
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

			<DuelDialog
				open={duelOpen}
				onClose={() => {
					setDuelOpen(false);
				}}
				onBack={() => {
					setDuelOpen(false);
					setStartOpen(true);
				}}
				currentSettings={game.currentGameConfig}
				setLocalSettings={game.setCurrentGameConfig}
				createDuel={game.createDuel}
				joinDuel={game.joinDuel}
				submitSecret={game.submitSecret}
				duelStatus={game.duelStatus}
				sessionId={game.sessionId}
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
				gamePaused={
					startOpen ||
					startConfigOpen ||
					duelOpen ||
					showSettings ||
					game.gameOver
				}
			/>
			{/* Player game tracking stats, can be implemented if database is setup*/}
			{/* <Stats stats={game.stats} /> */}
			<GameOverDialog
				open={selectedMode !== "multi" && game.gameOver && !startOpen && !startConfigOpen}
				lastResult={game.lastResult}
				answer={game.answer}
				guessesUsed={game.currentRow + 1}
				handlePlayAgain={() => handleStartGame(game.currentGameConfig)}
			/>

			<DuelResultDialog
				open={game.duelStatus === "complete" && !startOpen && !startConfigOpen && !duelOpen && selectedMode === "multi"}
				playerName={game.playerName}
				result={game.duelResult}
				onPlayAgain={() => {
					setStartOpen(true);
				}}
			/>

			<Settings
				open={showSettings}
				currentSettings={game.currentGameConfig}
				setLocalSettings={game.setCurrentGameConfig}
				submitSettingsToGame={handleStartGame}
				onClose={() => setShowSettings(false)}
			/>

			{/* Message for submissions not being a invalid words or words not long enough */}
			<Snackbar
				open={!!game.message}
				message={game.message}
				onClose={game.clearMessage}
				autoHideDuration={5000}
			/>

			{/* Multiplayer: show a waiting notice after this player finishes but before duel result */}
			<Snackbar
				open={
					selectedMode === "multi" &&
					game.gameOver &&
					game.duelStatus !== "complete"
				}
				message="Waiting for opponent to finish…"
				onClose={() => {}}
			/>
		</div>
	);
}
