import { BaseTableData, ValueTableData } from "../../../types/Tables";

type ValidationResult = { ok: boolean; errors?: Record<string, string>; }

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

