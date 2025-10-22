import {
	Dialog,
	DialogTitle,
	DialogContent,
	Button,
	Stack,
} from "@mui/material";

export type GameMode = "single" | "multi";

type GameStartProps = {
	open: boolean;
	onSelect: (mode: GameMode) => void;
	onClose?: () => void;
};

export function GameStartOverlay({ open, onSelect, onClose }: GameStartProps) {
	return (
		<Dialog
			open={open}
			onClose={(_, reason) => {
				// Prevent closing via backdrop click or Escape to avoid limbo state
				if (reason === "backdropClick") return;
				onClose?.();
			}}
			disableEscapeKeyDown
			aria-labelledby="game-start-title"
		>
			<DialogTitle id="game-start-title">Choose game mode</DialogTitle>
			<DialogContent>
				<Stack
					direction={{ xs: "column", sm: "row" }}
					spacing={2}
					sx={{ mt: 1 }}
				>
					<Button
						variant="contained"
						color="primary"
						onClick={() => onSelect("single")}
					>
						Single player
					</Button>
					<Button
						variant="contained"
						color="primary"
						onClick={() => onSelect("multi")}
					>
						Multiplayer
					</Button>
				</Stack>
			</DialogContent>
		</Dialog>
	);
}

export default GameStartOverlay;
