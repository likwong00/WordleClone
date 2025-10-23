import { render, screen, fireEvent } from "@testing-library/react";
import { Settings } from "./Settings";
import type { GameConfig } from "../../hooks/useGame";

const DEFAULT_SETTINGS: GameConfig = { maxGuesses: 6, wordLength: 5 };

// Mock MUI Slider with a simple range input for easier interaction in tests
jest.mock("@mui/material/Slider", () => ({
	__esModule: true,
	default: (props: any) => (
		<input
			type="range"
			aria-label={props["aria-label"]}
			id={props.id}
			min={props.min}
			max={props.max}
			step={props.step}
			value={props.value}
			onChange={(e) =>
				props.onChange?.(
					e,
					Number((e.target as HTMLInputElement).value),
				)
			}
		/>
	),
}));

describe("Settings component", () => {
	test("Apply calls setLocalSettings, submitSettingsToGame and onClose when inputs are valid (no extra words)", () => {
		const setLocalSettings = jest.fn();
		const submitSettingsToGame = jest.fn();
		const onClose = jest.fn();

		render(
			<Settings
				open={true}
				currentSettings={DEFAULT_SETTINGS}
				setLocalSettings={setLocalSettings}
				submitSettingsToGame={submitSettingsToGame}
				onClose={onClose}
			/>,
		);

		const maxSlider = screen.getByLabelText(/max guesses/i);
		fireEvent.change(maxSlider, { target: { value: "8" } });

		const apply = screen.getByRole("button", { name: /apply/i });
		expect(apply).toBeEnabled();
		fireEvent.click(apply);

		expect(setLocalSettings).toHaveBeenCalledWith({
			maxGuesses: 8,
			wordLength: 5,
			extraWordPool: undefined,
		});
		expect(submitSettingsToGame).toHaveBeenCalledWith({
			maxGuesses: 8,
			wordLength: 5,
			extraWordPool: undefined,
		});
		expect(onClose).toHaveBeenCalled();
	});

	test("max guesses slider stays within 3-10 and Apply remains enabled at boundaries", () => {
		render(
			<Settings
				open={true}
				currentSettings={DEFAULT_SETTINGS}
				setLocalSettings={jest.fn()}
				submitSettingsToGame={jest.fn()}
			/>,
		);

		const maxSlider = screen.getByLabelText(/max guesses/i);
		// Set to min
		fireEvent.change(maxSlider, { target: { value: "3" } });
		const apply1 = screen.getByRole("button", { name: /apply/i });
		expect(apply1).toBeEnabled();

		// Set to max
		fireEvent.change(maxSlider, { target: { value: "10" } });
		const apply2 = screen.getByRole("button", { name: /apply/i });
		expect(apply2).toBeEnabled();
	});

	test("enables Apply when extra words match current wordLength", () => {
		const setLocalSettings = jest.fn();
		render(
			<Settings
				open={true}
				currentSettings={{ maxGuesses: 6, wordLength: 5 }}
				setLocalSettings={setLocalSettings}
				submitSettingsToGame={jest.fn()}
			/>,
		);

		const wordsInput = screen.getByLabelText(
			/Additional words/i,
		) as HTMLInputElement;
		fireEvent.change(wordsInput, { target: { value: "apple, crane" } });

		const apply = screen.getByRole("button", { name: /apply/i });
		expect(apply).toBeEnabled();
	});

	test("disables Apply and shows word list error when any word length is invalid", () => {
		render(
			<Settings
				open={true}
				currentSettings={{ maxGuesses: 6, wordLength: 5 }}
				setLocalSettings={jest.fn()}
				submitSettingsToGame={jest.fn()}
			/>,
		);

		const wordsInput = screen.getByLabelText(
			/Additional words/i,
		) as HTMLInputElement;
		fireEvent.change(wordsInput, { target: { value: "apple, apples" } }); // second word wrong length

		const apply = screen.getByRole("button", { name: /apply/i });
		expect(apply).toBeDisabled();

		const alerts = screen.getAllByRole("alert");
		expect(
			alerts.some((a) => /correct length/i.test(a.textContent || "")),
		).toBe(true);
	});

	test("treats empty word list as valid", () => {
		render(
			<Settings
				open={true}
				currentSettings={{ maxGuesses: 6, wordLength: 5 }}
				setLocalSettings={jest.fn()}
				submitSettingsToGame={jest.fn()}
			/>,
		);

		const wordsInput = screen.getByLabelText(
			/Additional words/i,
		) as HTMLInputElement;
		fireEvent.change(wordsInput, { target: { value: "   " } });

		const apply = screen.getByRole("button", { name: /apply/i });
		expect(apply).toBeEnabled();
	});

	test("word length slider controls validation: mismatch disables, match enables", () => {
		render(
			<Settings
				open={true}
				currentSettings={{ maxGuesses: 6, wordLength: 5 }}
				setLocalSettings={jest.fn()}
				submitSettingsToGame={jest.fn()}
			/>,
		);

		const wordsInput = screen.getByLabelText(
			/Additional words/i,
		) as HTMLInputElement;
		fireEvent.change(wordsInput, { target: { value: "apple, crane" } }); // length 5

		const wordLenSlider = screen.getByLabelText(/word length/i);
		// Set word length to 7 -> should invalidate current list (length 5)
		fireEvent.change(wordLenSlider, { target: { value: "7" } });
		const applyDisabled = screen.getByRole("button", { name: /apply/i });
		expect(applyDisabled).toBeDisabled();

		// Set back to 5 -> should validate list
		fireEvent.change(wordLenSlider, { target: { value: "5" } });
		const applyEnabled = screen.getByRole("button", { name: /apply/i });
		expect(applyEnabled).toBeEnabled();
	});
});
