import { BaseTableData, ValueTableData, TableCompletion, CellValue, CellKind, TableState } from "../../types/Tables";
import { GradingResult, GradingState } from "../../types/Grading";

type ParseResult = {
	data: BaseTableData;
	errors?: Record<string, string>;
};

type ValueTableParseResult = {
	data: ValueTableData;
	errors?: Record<string, string>;
};

type ValidationResult = { ok: boolean; errors?: Record<string, string>; }

export type CellGradingState = Record<string, Record<string, GradingState>>; 

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

// ==================== SHARED UTILITIES ====================

/**
 * Extract all values from a TableState answer key
 */
export function getAllValues(answerKey: TableState): CellValue[] {
	const values: CellValue[] = [];
	for (const rowData of Object.values(answerKey)) {
		for (const value of Object.values(rowData)) {
			if (value !== null) {
				values.push(value);
			}
		}
	}
	return values;
}

/**
 * Get all unique values from a TableState answer key
 */
export function getAllUniqueValues(answerKey: TableState): CellValue[] {
	const values = getAllValues(answerKey);
	return Array.from(new Set(values));
}

/**
 * Auto-detect the best cell kind based on the values in the answer key
 */
export function detectCellKind(values: CellValue[]): CellKind {
	const uniqueValues = new Set(values.filter(v => v !== null));

	// All numbers → 'number'
	if (values.every(v => v === null || typeof v === 'number')) {
		return 'number';
	}

	// Small unique set (≤ 10) → 'select' for better UX
	if (uniqueValues.size > 0 && uniqueValues.size <= 10) {
		return 'select';
	}

	// Default → 'text'
	return 'text';
}

/**
 * Compare two cell values for equality
 * Handles string, number, and boolean comparisons
 */
export function compareValues(expected: CellValue, actual: CellValue): boolean {
	if (expected === null || actual === null) return false;

	if (typeof expected === 'number' && typeof actual === 'number') {
		return Math.abs(expected - actual) < 0.0001; // Floating point tolerance
	}

	return String(expected).trim() === String(actual).trim();
}

// ==================== ADJACENCY TABLE ====================

export function adjacencyTableDataParser(code: string): ValueTableParseResult {
	const errors: Record<string, string> = {};
	const categories: string[] = [];
	const rawData: Map<string, string[]> = new Map();

	const categoryPattern = /^\s*(?<category>[a-z_](?:[a-z0-9_]* ?[a-z0-9_]+)*)\s*=\s*(?<values>[^;]+?)\s*;/gim;
	const matches = [...code.matchAll(categoryPattern)];

	if (matches.length === 0) {
		errors['parse.noMatches'] = 'No valid category entries found. Expected lines like: category = val1 | val2;';
		return { data: { rows: [], cols: [], answerKey: {} }, errors };
	}

	const seen = new Set<string>();
	for (const match of matches) {
		const rawCategory = match.groups?.category ?? '';
		const rawValues = match.groups?.values ?? '';
		const category = rawCategory.trim().toLowerCase();

		if (seen.has(category)) {
			errors[`parse.duplicateCategory.${category}`] = `Duplicate category "${category}" was defined more than once.`;
			continue;
		}
		seen.add(category);

		const values = rawValues
			.split('|')
			.map(s => s.trim())
			.filter(Boolean);

		categories.push(category);
		rawData.set(category, values);
	}

	const n = categories.length;

	// Validate value counts
	for (const category of categories) {
		const values = rawData.get(category) ?? [];
		const expected = n - 1;

		if (values.length !== expected) {
			errors[`parse.valueCount.${category}`] =
				`Category "${category}" has ${values.length} values, but expected ${expected} (n-1 where n=${n}).`;
		}
	}

	// Build TableState answer key
	const answerKey: TableState = {};

	for (let i = 0; i < categories.length; i++) {
		const rowCategory = categories[i];
		const values = rawData.get(rowCategory) ?? [];

		answerKey[rowCategory] = {};

		let valueIndex = 0;
		for (let j = 0; j < categories.length; j++) {
			if (i === j) continue; // Skip diagonal

			const colCategory = categories[j];
			const rawValue = values[valueIndex];

			// Try to parse as number
			let cellValue: CellValue = null;
			if (rawValue !== undefined && rawValue !== '') {
				const num = Number(rawValue);
				cellValue = isNaN(num) ? rawValue : num;
			}

			answerKey[rowCategory][colCategory] = cellValue;
			valueIndex++;
		}
	}

	const data: ValueTableData = {
		rows: categories,
		cols: categories,
		answerKey
	};

	return Object.keys(errors).length > 0 ? { data, errors } : { data };
}
export function adjacencyTableDataValidator(data: ValueTableData): ValidationResult {
	const errors: Record<string, string> = {};

	// Check 1: Rows must exist
	if (data.rows.length === 0) {
		errors['rows.empty'] = 'No rows found. Expected at least one category.';
	}

	// Check 2: Cols must exist
	if (data.cols.length === 0) {
		errors['cols.empty'] = 'No columns found. Expected at least one category.';
	}

	// Check 3: Rows and cols must be identical (symmetric matrix)
	if (data.rows.length !== data.cols.length) {
		errors['symmetry.lengthMismatch'] =
			`Rows (${data.rows.length}) and columns (${data.cols.length}) must have the same length for adjacency tables.`;
	} else {
		const rowSet = new Set(data.rows);
		const colSet = new Set(data.cols);

		for (const row of data.rows) {
			if (!colSet.has(row)) {
				errors[`symmetry.rowNotInCols.${row}`] =
					`Row "${row}" does not appear in columns. Adjacency tables must be symmetric.`;
			}
		}

		for (const col of data.cols) {
			if (!rowSet.has(col)) {
				errors[`symmetry.colNotInRows.${col}`] =
					`Column "${col}" does not appear in rows. Adjacency tables must be symmetric.`;
			}
		}
	}

	// Check 4: Answer key must have entry for each row
	for (const row of data.rows) {
		if (!data.answerKey[row]) {
			errors[`answerKey.missingRow.${row}`] =
				`Row "${row}" has no entry in answer key.`;
			continue;
		}

		// Check 5: Each row must have entries for all OTHER columns (not itself)
		for (const col of data.cols) {
			if (row === col) {
				// Diagonal should be undefined or null
				const diagValue = data.answerKey[row][col];
				if (diagValue !== undefined && diagValue !== null) {
					errors[`answerKey.diagonalValue.${row}`] =
						`Diagonal cell (${row}, ${row}) should be empty, but has value "${diagValue}".`;
				}
			} else {
				// Non-diagonal should have a value
				const value = data.answerKey[row][col];
				if (value === undefined) {
					errors[`answerKey.missingCell.${row}.${col}`] =
						`Missing value at cell (${row}, ${col}). All non-diagonal cells must have values.`;
				}
			}
		}
	}

	return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true };
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

// ==================== LOOKUP TABLE ====================

export function lookupTableDataParser(code: string): ValueTableParseResult {
	const errors: Record<string, string> = {};
	let cols: string[] = [];
	const rows: string[] = [];
	const answerKey: TableState = {};

	// Extract header line (columns)
	const headerPattern = /^\s*=\s*(?<cols>[^;]+?)\s*;/m;
	const headerMatch = code.match(headerPattern);

	if (!headerMatch) {
		errors['parse.noHeader'] =
			'Missing header line. Expected first line like: = col1 | col2 | col3;';
		return { data: { rows: [], cols: [], answerKey: {} }, errors };
	}

	const rawCols = headerMatch.groups?.cols ?? '';
	cols = rawCols
		.split('|')
		.map(s => s.trim())
		.filter(Boolean);

	if (cols.length === 0) {
		errors['parse.emptyHeader'] = 'Header line has no columns. Expected at least one column after "=".';
		return { data: { rows: [], cols: [], answerKey: {} }, errors };
	}

	// Extract row lines
	const rowPattern = /^\s*(?<row>[^=]+?)\s*=\s*(?<values>[^;]+?)\s*;/gm;
	const rowMatches = [...code.matchAll(rowPattern)];

	const seenRows = new Set<string>();

	for (const match of rowMatches) {
		const rawRow = match.groups?.row ?? '';
		const rawValues = match.groups?.values ?? '';

		// Skip the header line (it has empty row name)
		if (rawRow.trim() === '') continue;

		const row = rawRow.trim();

		if (seenRows.has(row)) {
			errors[`parse.duplicateRow.${row}`] = `Duplicate row "${row}" was defined more than once.`;
			continue;
		}
		seenRows.add(row);

		const values = rawValues
			.split('|')
			.map(s => s.trim())
			.filter(s => s !== '');

		// Validate value count
		if (values.length !== cols.length) {
			errors[`parse.valueCount.${row}`] =
				`Row "${row}" has ${values.length} values, but expected ${cols.length} (matching column count).`;
			continue;
		}

		rows.push(row);
		answerKey[row] = {};

		for (let i = 0; i < cols.length; i++) {
			const col = cols[i];
			const rawValue = values[i];

			// Check for disabled cell marker
			if (rawValue === '-') {
				answerKey[row][col] = null;
				continue;
			}

			// Try to parse as number
			let cellValue: CellValue = null;
			if (rawValue !== undefined && rawValue !== '') {
				const num = Number(rawValue);
				cellValue = isNaN(num) ? rawValue : num;
			}

			answerKey[row][col] = cellValue;
		}
	}

	if (rows.length === 0) {
		errors['parse.noRows'] = 'No data rows found. Expected at least one line like: row = val1 | val2;';
	}

	const data: ValueTableData = { rows, cols, answerKey };

	return Object.keys(errors).length > 0 ? { data, errors } : { data };
}
export function lookupTableDataValidator(data: ValueTableData): ValidationResult {
	const errors: Record<string, string> = {};

	// Check 1: Columns must exist
	if (data.cols.length === 0) {
		errors['cols.empty'] = 'No columns found. Expected at least one column in header line.';
	}

	// Check 2: Rows must exist
	if (data.rows.length === 0) {
		errors['rows.empty'] = 'No rows found. Expected at least one data row.';
	}

	// Check 3: No row name should match any column name (avoid confusion)
	const colSet = new Set(data.cols);
	for (const row of data.rows) {
		if (colSet.has(row)) {
			errors[`naming.rowColConflict.${row}`] =
				`Row name "${row}" is also a column name. This creates ambiguity and should be avoided.`;
		}
	}

	// Check 4: Answer key must have entry for each row
	for (const row of data.rows) {
		if (!data.answerKey[row]) {
			errors[`answerKey.missingRow.${row}`] =
				`Row "${row}" has no entry in answer key.`;
			continue;
		}

		// Check 5: Each row must have entry for each column (null is allowed for disabled cells)
		for (const col of data.cols) {
			const value = data.answerKey[row][col];
			if (value === undefined) {
				errors[`answerKey.missingCell.${row}.${col}`] =
					`Missing value at cell (${row}, ${col}). Cells must have values or be marked as disabled with '-'.`;
			}
		}
	}

	return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true };
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
// ------------------------------------------------
