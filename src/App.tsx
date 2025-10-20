import { useEffect, useState } from "react";
import SettingsIcon from '@mui/icons-material/Settings';

import { useGame } from "./hooks/game";
import { Board } from "./components/Board";
import { Keyboard } from "./components/Keyboard/Keyboard";
import { Settings } from "./components/Settings/Settings";
import { Stats } from "./components/Stats";
import { Message} from "./components/Message";

export default function App() {
	const game = useGame();
	const [showSettings, setShowSettings] = useState(false);

	return (
		<div className="app">
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
			<Board game={game} />
			<Keyboard addChar={game.addChar} backspace={game.backspace} submitGuess={game.submitGuess} letterStates={game.letterStates} gamePaused={showSettings || game.gameOver}/>
			<Stats stats={game.stats} />
			{game.gameOver && (
				<Message variant="overlay">
					<div>
						<h2>
							{game.lastResult === "win"
								? "You win!"
								: "Game over"}
						</h2>
						<p>
							Answer: <strong>{game.answer}</strong>
						</p>
						{game.lastResult === "win" &&
							game.guessesUsed != null && (
								<p>
									Guesses used:{" "}
									<strong>{game.guessesUsed}</strong>
								</p>
							)}
						<div className="overlay-actions">
							<button onClick={game.reset}>Play again</button>
						</div>
					</div>
				</Message>
			)}

			{showSettings && (
				<Message variant="overlay" onClose={() => setShowSettings(false)}>
					<Settings
						maxGuesses={game.maxGuesses}
						setConfig={game.setConfig}
						reset={game.reset}
						onClose={() => setShowSettings(false)}
					/>
				</Message>
			)}

			{game.message && (
				<Message
					text={game.message}
					variant="toast"
					onClose={game.clearMessage}
				/>
			)}
		</div>
	);
}
