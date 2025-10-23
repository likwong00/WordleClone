import { useEffect, useMemo, useState } from "react";
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormControlLabel,
	Radio,
	RadioGroup,
	Stack,
	TextField,
	Typography,
	CircularProgress,
} from "@mui/material";
import { GameConfig } from "../../hooks/useGame";

type DuelDialogProps = {
	open: boolean;
	onClose: () => void;
    onBack: () => void;
	currentSettings: GameConfig;
	setLocalSettings: (config: GameConfig) => void;
	createDuel: (
		cfg: GameConfig,
		playerName: string,
		secretWord: string,
	) => void;
	joinDuel: (gameId: string, playerName: string) => void;
	submitSecret: (secretWord: string) => void;
	duelStatus: "idle" | "waiting" | "need-secret" | "in-progress" | "complete";
	sessionId: string | null;
};

export function DuelDialog({
	open,
	onClose,
    onBack,
	currentSettings,
	setLocalSettings,
	createDuel,
	joinDuel,
	submitSecret,
	duelStatus,
	sessionId,
}: DuelDialogProps) {
	const [mode, setMode] = useState<"create" | "join">("create");
	const [playerName, setPlayerName] = useState("Player");
	const [gameId, setGameId] = useState("");
	const [secret, setSecret] = useState("");
	const [error, setError] = useState<string | null>(null);

	// useEffect(() => {
	// 	if (!open) {
	// 		setMode("create");
	// 		setPlayerName("Player");
	// 		setGameId("");
	// 		setSecret("");
	// 		setError(null);
	// 	}
	// }, [open]);

	const secretError = useMemo(() => {
		if (!secret) return null;
		if (secret.length !== currentSettings.wordLength) {
			return `Secret must be ${currentSettings.wordLength} letters`;
		}
		if (!/^[a-zA-Z]+$/.test(secret)) return "Letters only";
		return null;
	}, [secret, currentSettings.wordLength]);

	const creating = mode === "create";

	const handlePrimary = () => {
		if (creating) {
			if (secretError) {
				setError(secretError);
				return;
			}
			createDuel(currentSettings, playerName.trim() || "Player", secret);
		} else {
			if (!gameId) {
				setError("Enter a game code to join");
				return;
			}
			joinDuel(gameId.trim(), playerName.trim() || "Player");
		}
	};

	const handleSubmitSecret = () => {
		if (secretError) {
			setError(secretError);
			return;
		}
		submitSecret(secret);
	};

	// Auto-close when duel starts
	useEffect(() => {
		if (open && duelStatus === "in-progress") onClose();
	}, [duelStatus, open, onClose]);

	return (
		<Dialog
			open={open}
			onClose={(_, reason) => {
				if (reason === "backdropClick" || reason === "escapeKeyDown") return;
			}}
		>
			<DialogTitle>1 VS 1 Duel</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ minWidth: 360 }}>
					<TextField
						label="Your name"
						value={playerName}
						onChange={(e) => setPlayerName(e.target.value)}
						size="small"
					/>

					<FormControl>
						<RadioGroup
							row
							value={mode}
							onChange={(e) => setMode(e.target.value as any)}
						>
							<FormControlLabel
								value="create"
								control={<Radio />}
								label="Create"
							/>
							<FormControlLabel
								value="join"
								control={<Radio />}
								label="Join"
							/>
						</RadioGroup>
					</FormControl>

					{mode === "create" ? (
						<>
							<Typography variant="body2">
								Settings: {currentSettings.wordLength}-letter
								words, {currentSettings.maxGuesses} max guesses
							</Typography>

							<TextField
								label={`Your secret word (${currentSettings.wordLength})`}
								value={secret}
								onChange={(e) => {
									setSecret(e.target.value.toLowerCase());
									setError(null);
								}}
								size="small"
								inputProps={{
									maxLength: currentSettings.wordLength,
								}}
								helperText={
									secretError ||
									"Keep it secret from your opponent"
								}
								error={!!secretError}
							/>
							{duelStatus === "waiting" && (
								<Stack
									direction="row"
									spacing={1}
									alignItems="center"
								>
									<CircularProgress size={18} />
									<Typography variant="body2">
										Waiting for opponent… Share code:{" "}
										<strong>{sessionId}</strong>
									</Typography>
								</Stack>
							)}
						</>
					) : (
						<>
							<TextField
								label="Game code"
								value={gameId}
								onChange={(e) => {
									setGameId(e.target.value);
									setError(null);
								}}
								size="small"
							/>
							{duelStatus === "need-secret" && (
								<TextField
									label={`Your secret word (${currentSettings.wordLength})`}
									value={secret}
									onChange={(e) => {
										setSecret(e.target.value.toLowerCase());
										setError(null);
									}}
									size="small"
									inputProps={{
										maxLength: currentSettings.wordLength,
									}}
									helperText={
										secretError || "Enter to begin the duel"
									}
									error={!!secretError}
								/>
							)}
						</>
					)}

					{error && (
						<Typography color="error" variant="body2">
							{error}
						</Typography>
					)}
				</Stack>
			</DialogContent>
			<DialogActions>
				{mode === "create" ? (
					<>
						<Button onClick={onBack}>Back</Button>
						<Button
							variant="contained"
							onClick={handlePrimary}
							disabled={
								!!secretError ||
								secret.length !== currentSettings.wordLength
							}
						>
							Create Duel
						</Button>
					</>
				) : duelStatus === "need-secret" ? (
					<>
						<Button onClick={onBack}>Back</Button>
						<Button
							variant="contained"
							onClick={handleSubmitSecret}
							disabled={
								!!secretError ||
								secret.length !== currentSettings.wordLength
							}
						>
							Submit Secret
						</Button>
					</>
				) : (
					<>
						<Button onClick={onBack}>Back</Button>
						<Button
							variant="contained"
							onClick={handlePrimary}
							disabled={
								!playerName || (mode === "join" && !gameId)
							}
						>
							Join
						</Button>
					</>
				)}
			</DialogActions>
		</Dialog>
	);
}
