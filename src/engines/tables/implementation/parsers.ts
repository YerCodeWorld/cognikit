import { BaseTableData, ValueTableData, CellValue, TableState } from "../../../types/Tables";

type ParseResult = {
	data: BaseTableData;
	errors?: Record<string, string>;
};

type ValueTableParseResult = {
	data: ValueTableData;
	errors?: Record<string, string>;
};


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

