import { BaseTableData, TableCompletion } from "../../types";
import { GradingResult } from "../../types/Grading";

type ParseResult = {
	data: BaseTableData;
	errors?: Record<string, string>;
};

type ValidationResult = { ok: boolean; errors?: Record<string, string>; } 

/**
 * The classification table presents a default configuration where we have non-equal rows and columns and 
 * participant is presented with check boxes on each cell to add 'attributes' to each row item. 
 * 
 * The n-ary table is just a superset or the former, with the discrepancies being using radio buttons instead
 * (single selection) and not allowing row items to be in more than one category (this is handled in the 
 * n-ary table validator). 
 * 
 * For grading, we take the row item and the checked columns. Using the answerKey, we check if those columns
 * that were selected contain the row item; correct if yes, wrong otherwise. If there are mixed correct/wrong,
 * we just fractionate the grading n/100, where n = correct items. 
 * 
 * Classification Example - Notice repetitions
 *
 * WORK = Talk with my colleagues | Eat | Report Attendance;
 * SCHOOL = Eat | Complete my examns | Play in the basketball club;
 * HOME = Eat | Talk with my colleagues | Sleep;
 *
 * N-ARY example 
 *
 * TRUE = Water is Blue | An active volcano is hot;
 * FALSE = MJ was a piano player | Africa is above Europe | A chef is someone who writes poems	
 */
export function basicTableDataParser(code: string): ParseResult {

	let rows: string[] = [], cols: string[] = [];	
	let answerKey: Map<string, string[]> = new Map<string, string[]>();	
	const errors: Record<string, string> = {};
	
	const categoryPattern = 
		/^\s*(?<category>[A-Z_](?:[A-Z0-9_]* ?[A-Z0-9_]+)*)\s*=\s*(?<items>[^;]+?)\s*;\s*$/gm;

	const matches = [...code.matchAll(categoryPattern)];

	if (matches.length === 0) {
		errors['parse.noMatches'] =
			'No valid category entries found. Expected lines like: CATEGORY = item1 | item2;';
	}

	const seen = new Set<string>();
	for (const match of matches) {		
		const rawCategory = match.groups?.category ?? '';
		const rawItems = match.groups?.items ?? '';

		const category = rawCategory.trim().toLowerCase();

		if (answerKey.has(category)) {
			errors[`parse.duplicateCategory.${category}`] =
				`Duplicate category "${category}" was defined more than once. Merge them into a single entry.`;
			continue;
		}

		const items = rawItems
			.split('|')
			.map(s => s.replace(/\s+/g, ' ').trim())
			.filter(Boolean);

		if (items.length === 0) {
			errors[`parse.emptyCategory.${category}`] =
				`Category "${category}" has no items. Expected at least one item before ';'.`;

			// still register the column so validator can give consistent feedback
			cols.push(category);
			answerKey.set(category, []);
			continue;
		}

		cols.push(category);

		for (const item of items) {
			if (seen.has(item)) {
				continue;
			}
			seen.add(item);
			rows.push(item);
		}

		answerKey.set(category, items);
	}

	const data: BaseTableData = { rows, cols, answerKey };

	return Object.keys(errors).length > 0 ? { data, errors } : { data }; 
}

export function basicTableDataValidator(
	data: BaseTableData,
	preset: 'classification' | 'n-ary' = 'classification'
): ValidationResult {

	const errors: Record<string, string> = {};
	const answerKey = data.answerKey;

	// ----------------------------
	// Common checks (all presets)
	// ----------------------------

	if (data.cols.length === 0) {
		errors['cols.empty'] = 'No categories were found. Expected at least one CATEGORY = ... ; entry.';
	}

	if (data.rows.length === 0) {
		errors['rows.empty'] = 'No row items were found. Expected at least one item in any category.';
	}

	// 1) Ensure no header is also a row item
	for (const col of data.cols) {
		if (data.rows.includes(col)) {
			errors[`cols.rowConflict.${col}`] =
				`Category "${col}" is also present as an item. Category labels cannot be used as row items.`;
		}
	}

	// 2) All categories contain at least one item + answerKey must match cols
	// (Also catches: category exists in cols but missing in answerKey)
	for (const col of data.cols) {
		const items = answerKey.get(col);

		if (!items) {
			errors[`answerKey.missing.${col}`] =
				`Category "${col}" has no entry in answerKey. This usually indicates a parser issue.`;
			continue;
		}

		if (items.length === 0) {
			errors[`answerKey.emptyCategory.${col}`] =
				`Category "${col}" has no items. Each category must include at least one item.`;
		}
	}

	// 3) Detect duplicate items inside a category list 
	for (const [col, items] of answerKey.entries()) {
		const seen = new Set<string>();
		for (const item of items) {
			if (seen.has(item)) {
				errors[`answerKey.duplicateItem.${col}`] =
					`Category "${col}" includes duplicate item "${item}". Remove duplicates.`;
				break;
			}
			seen.add(item);
		}
	}

	// -----------------------------------------
	// Preset-specific checks: n-ary constraints
	// -----------------------------------------
	if (preset === 'n-ary') {
		// Build membership index: row item -> categories it appears in
		const membership = new Map<string, string[]>();

		for (const [col, items] of answerKey.entries()) {
			for (const item of items) {
				const arr = membership.get(item);
				if (arr) arr.push(col);
				else membership.set(item, [col]);
			}
		}

		// Decide policy: "exactly one" vs "at most one"
		// Here: exactly one. If you want "at most one", remove the unassigned check.
		for (const row of data.rows) {
			const cats = membership.get(row) ?? [];

			if (cats.length === 0) {
				errors[`nary.unassigned.${row}`] =
					`Item "${row}" is not assigned to any category. In n-ary tables, every item must belong to exactly one category.`;
				continue;
			}

			if (cats.length > 1) {
				errors[`nary.multiCategory.${row}`] =
					`Item "${row}" appears in multiple categories (${cats.join(', ')}). In n-ary tables, items must belong to exactly one category.`;
			}
		}
	}

	return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true };
}

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

	const score = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

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
		? (totalCorrectSelections / totalPossibleSelections) * 100
		: 0;

	return {
		score,
		correct: totalCorrectSelections,
		total: totalPossibleSelections
	};
}

// We are going to ignore this just for the moment; we will create an interaction the classification module
// and then a dema index.html | Does do not need a parser yet (the parser is intended for production/test usage), for the moment we just pass the hardcoded data.
export function adjacencyTableDataParser() {}
export function adjacencyTableDataValidator() {}

export function lookupTableDataParser() {}
export function lookupTableDataValidator() {}


export function adjacencyTableGrader() {}
export function lookupTableGrader() {}
// ------------------------------------------------
