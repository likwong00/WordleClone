import {
	Dialog,
	DialogTitle,
	DialogContent,
	Button,
} from "@mui/material";

type GameOverProps = {
    open: boolean;
    lastResult: "win" | "lose" | null;
    handlePlayAgain: () => void;
    answer?: string;
    guessesUsed?: number;
};

export function GameOverDialog({ open, lastResult, answer, guessesUsed, handlePlayAgain }: GameOverProps) {
    const gameOverMessage = lastResult === "win" ? "You Win!" : "Game Over!";
    return (
		<Dialog
			open={open}
			onClose={(_, reason) => {
				// Prevent closing via backdrop click or Escape to avoid limbo state
				if (reason === "backdropClick") return;
			}}
			disableEscapeKeyDown
			aria-labelledby="game-over-title"
		>
			<DialogTitle id="game-over-title">{gameOverMessage}</DialogTitle>
			<DialogContent>
                    <p>
                        Answer: <strong>{answer}</strong>
                    </p>
                    {lastResult === "win" &&
                    guessesUsed != null && (
                        <p>
                            Guesses used:{" "}
                            <strong>{guessesUsed}</strong>
                        </p>
                    )}
					<Button
						variant="contained"
						color="primary"
						onClick={handlePlayAgain}
					>
						Play Again
					</Button>
			</DialogContent>
		</Dialog>
	);
}