import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Stack,
	Typography,
} from "@mui/material";

type Result = {
	winner: string | null;
	results: {
		id: string;
		lastResult: string | null;
		guessesUsed?: number | null;
	}[];
};

type DuelResultDialogProps = {
	open: boolean;
	playerName: string;
	result: Result | null;
	onPlayAgain?: () => void;
};

export function DuelResultDialog({
	open,
	playerName,
	result,
	onPlayAgain,
}: DuelResultDialogProps) {
	const title = !result?.winner
		? "It's a draw!"
		: playerName === result?.winner
			? "You Win!"
			: "Game Over!";
	return (
		<Dialog
			open={open}
			onClose={(_, reason) => {
				if (reason === "backdropClick" || reason === "escapeKeyDown")
					return;
			}}
		>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent>
				<Stack spacing={1}>
					{result?.results?.map((r) => (
						<Typography key={r.id} variant="body2">
							{r.id}: {r.lastResult}{" "}
							{typeof r.guessesUsed === "number"
								? `(in ${r.guessesUsed})`
								: ""}
						</Typography>
					))}
				</Stack>
			</DialogContent>
			<DialogActions>
				{onPlayAgain && (
					<Button variant="contained" onClick={onPlayAgain}>
						Play again
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
}
