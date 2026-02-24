import { CellValue, CellKind, TableState } from "../../../types/Tables";

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


