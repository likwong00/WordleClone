import React from "react";
import { render } from "@testing-library/react";
import { Board } from "./Board";
import type { TileState } from "../../hooks/useGame";

describe("Board", () => {
	const baseProps = {
		board: new Array<string>(6).fill(""),
		states: [] as TileState[][],
		currentRow: 0,
		currentGuess: "",
		wordLength: 5,
		maxGuesses: 6,
	} as const;

	test("renders grid with correct rows and tiles", () => {
		const { container } = render(<Board {...baseProps} />);

		const boardEl = container.querySelector(".board");
		expect(boardEl).toBeInTheDocument();

		const rows = container.querySelectorAll(".row");
		expect(rows.length).toBe(baseProps.maxGuesses);

		const tiles = container.querySelectorAll(".tile");
		expect(tiles.length).toBe(baseProps.maxGuesses * baseProps.wordLength);

		// All tiles are empty initially (no states, no guess)
		tiles.forEach((tile) => {
			expect(tile).toHaveClass("tile");
			expect(tile).toHaveClass("empty");
			expect(tile).not.toHaveClass("flip");
			expect(tile).toHaveTextContent("");
		});
	});

	test("shows current guess in the current row, uppercased", () => {
		const props = {
			...baseProps,
			currentRow: 2,
			currentGuess: "abC",
		};
		const { container } = render(<Board {...props} />);

		const rows = container.querySelectorAll(".row");
		const current = rows[props.currentRow]!;
		const tiles = current.querySelectorAll(".tile");

		expect(tiles[0]).toHaveTextContent("A");
		expect(tiles[1]).toHaveTextContent("B");
		expect(tiles[2]).toHaveTextContent("C");
		expect(tiles[3]).toHaveTextContent("");
		expect(tiles[4]).toHaveTextContent("");
	});

	test("applies state classes and flip with staggered delays on revealed rows", () => {
		const board: string[] = ["crane", "", "", "", "", ""];
		const states: TileState[][] = [
			["correct", "present", "absent", "empty", "correct"],
		];
		const props = {
			...baseProps,
			board,
			states,
		} as const;

		const { container } = render(<Board {...props} />);

		const firstRow = container.querySelectorAll(".row")[0]!;
		const tiles = Array.from(
			firstRow.querySelectorAll<HTMLDivElement>(".tile"),
		);

		const expectedStates = [
			"correct",
			"present",
			"absent",
			"empty",
			"correct",
		];

		tiles.forEach((tile, idx) => {
			expect(tile).toHaveClass("tile");
			expect(tile).toHaveClass(expectedStates[idx]!);
			// revealed => flip class present
			expect(tile).toHaveClass("flip");
			// check staggered transition delay
			const expectedDelay = `${idx * 150}ms`;
			expect((tile as HTMLDivElement).style.transitionDelay).toBe(
				expectedDelay,
			);
		});
	});

	test("does not flip when all tile states are empty", () => {
		const states: TileState[][] = [
			["empty", "empty", "empty", "empty", "empty"],
		];
		const props = { ...baseProps, states } as const;

		const { container } = render(<Board {...props} />);
		const firstRowTiles = container
			.querySelectorAll(".row")[0]!
			.querySelectorAll(".tile");
		firstRowTiles.forEach((tile) => {
			expect(tile).toHaveClass("empty");
			expect(tile).not.toHaveClass("flip");
		});
	});

	test("adds shake class to the current row when shake=true", () => {
		const props = { ...baseProps, currentRow: 1, shake: true } as const;
		const { container } = render(<Board {...props} />);

		const rows = container.querySelectorAll(".row");
		expect(rows[0]).not.toHaveClass("shake");
		expect(rows[1]).toHaveClass("shake");
	});
});
