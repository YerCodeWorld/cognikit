import { TableCompletion, TableState } from "../../../types/Tables";
import { GradingResult, GradingState } from "../../../types/Grading";
import { CellGradingState } from "../../../types/Tables"
import { compareValues } from "./utils";

export function naryTableGrader(
	answerKey: Map<string, string[]>,
	userData: TableCompletion,
	rows: string[]
): GradingResult {
	let correctCount = 0;
	const totalCount = rows.length;

	for (const row of rows) {
		const userSelected = userData[row]?.selectedCols ?? [];

		let correctColumn: string | null = null;
		for (const [col, items] of answerKey.entries()) {
			if (items.includes(row)) {
				correctColumn = col;
				break;
			}
		}

		if (userSelected.length === 1 && userSelected[0] === correctColumn) {
			correctCount++;
		}
	}

	const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

	return { score, correct: correctCount, total: totalCount };
}

export function lookupTableGrader(
	answerKey: TableState,
	userData: TableCompletion,
	rows: string[],
	cols: string[]
): GradingResult {
	let correctCount = 0;
	let totalCount = 0;

	for (const row of rows) {
		for (const col of cols) {
			const expected = answerKey[row]?.[col];

			// Skip disabled cells (marked with '-' in DSL, stored as null)
			if (expected === null) continue;

			const userValue = userData[row]?.values[col];

			totalCount++;
			if (compareValues(expected, userValue)) {
				correctCount++;
			}
		}
	}

	const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

	return { score, correct: correctCount, total: totalCount };
}

export function classificationTableGrader(
	answerKey: Map<string, string[]>,
	userData: TableCompletion,
	rows: string[],
	cols: string[]
): GradingResult {
	let totalCorrectSelections = 0;
	let totalPossibleSelections = 0;

	for (const row of rows) {
		const userSelected = new Set(userData[row]?.selectedCols ?? []);
		const correctColumns = new Set<string>();
		for (const [col, items] of answerKey.entries()) {
			if (items.includes(row)) {
				correctColumns.add(col);
			}
		}

		for (const col of cols) {
			const shouldBeSelected = correctColumns.has(col);
			const wasSelected = userSelected.has(col);

			if (shouldBeSelected === wasSelected) {
				totalCorrectSelections++;
			}
			totalPossibleSelections++;
		}
	}

	const score = totalPossibleSelections > 0
		? Math.round((totalCorrectSelections / totalPossibleSelections) * 100)
		: 0;

	return {
		score,
		correct: totalCorrectSelections,
		total: totalPossibleSelections
	};
}

export function adjacencyTableGrader(
	answerKey: TableState,
	userData: TableCompletion,
	rows: string[]
): GradingResult {
	let correctCount = 0;
	let totalCount = 0;

	for (const row of rows) {
		for (const col of rows) {
			if (row === col) continue; // Skip diagonal

			const expected = answerKey[row]?.[col];
			const userValue = userData[row]?.values[col];

			totalCount++;
			if (compareValues(expected, userValue)) {
				correctCount++;
			}
		}
	}

	const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

	return { score, correct: correctCount, total: totalCount };
}


// ==================== GRADING FEEDBACK ====================

/**
 * Generate per-cell grading state for adjacency tables
 */
export function getAdjacencyCellGrading(
	answerKey: TableState,
	userData: TableCompletion,
	rows: string[]
): CellGradingState {
	const cellStates: CellGradingState = {};

	for (const row of rows) {
		cellStates[row] = {};

		for (const col of rows) {
			if (row === col) continue; // Skip diagonal

			const expected = answerKey[row]?.[col];
			const userValue = userData[row]?.values[col];

			if (userValue === null || userValue === undefined || userValue === '') {
				cellStates[row][col] = 'missed';
			} else if (compareValues(expected, userValue)) {
				cellStates[row][col] = 'correct';
			} else {
				cellStates[row][col] = 'wrong';
			}
		}
	}

	return cellStates;
}

/**
 * Generate per-cell grading state for lookup tables
 */
export function getLookupCellGrading(
	answerKey: TableState,
	userData: TableCompletion,
	rows: string[],
	cols: string[]
): CellGradingState {
	const cellStates: CellGradingState = {};

	for (const row of rows) {
		cellStates[row] = {};

		for (const col of cols) {
			const expected = answerKey[row]?.[col];

			// Skip disabled cells
			if (expected === null) continue;

			const userValue = userData[row]?.values[col];

			if (userValue === null || userValue === undefined || userValue === '') {
				cellStates[row][col] = 'missed';
			} else if (compareValues(expected, userValue)) {
				cellStates[row][col] = 'correct';
			} else {
				cellStates[row][col] = 'wrong';
			}
		}
	}

	return cellStates;
}

/**
 * Generate per-cell grading state for classification tables
 */
export function getClassificationCellGrading(
	answerKey: Map<string, string[]>,
	userData: TableCompletion,
	rows: string[],
	cols: string[]
): CellGradingState {
	const cellStates: CellGradingState = {};

	for (const row of rows) {
		cellStates[row] = {};

		const userSelected = new Set(userData[row]?.selectedCols ?? []);
		const correctColumns = new Set<string>();

		for (const [col, items] of answerKey.entries()) {
			if (items.includes(row)) {
				correctColumns.add(col);
			}
		}

		for (const col of cols) {
			const shouldBeSelected = correctColumns.has(col);
			const wasSelected = userSelected.has(col);

			if (shouldBeSelected === wasSelected) {
				cellStates[row][col] = 'correct';
			} else if (!wasSelected && shouldBeSelected) {
				cellStates[row][col] = 'missed';
			} else {
				cellStates[row][col] = 'wrong';
			}
		}
	}

	return cellStates;
}

/**
 * Generate per-cell grading state for n-ary tables
 */
export function getNaryCellGrading(
	answerKey: Map<string, string[]>,
	userData: TableCompletion,
	rows: string[]
): CellGradingState {
	const cellStates: CellGradingState = {};

	for (const row of rows) {
		cellStates[row] = {};

		const userSelected = userData[row]?.selectedCols ?? [];

		let correctColumn: string | null = null;
		for (const [col, items] of answerKey.entries()) {
			if (items.includes(row)) {
				correctColumn = col;
				break;
			}
		}

		// For n-ary, mark the user's selection
		if (userSelected.length === 1) {
			const selectedCol = userSelected[0];
			if (selectedCol === correctColumn) {
				cellStates[row][selectedCol] = 'correct';
			} else {
				cellStates[row][selectedCol] = 'wrong';
			}
		} else if (userSelected.length === 0 && correctColumn) {
			cellStates[row][correctColumn] = 'missed';
		}
	}

	return cellStates;
}
// ------------------------------
