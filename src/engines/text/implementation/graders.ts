import {
	TextEngineBaseData,
	TextEngineBlanksData,
	TextEngineClassificationData,
	TextEngineBaseDataTarget
} from "../../../types/Text";
import { InputElementData } from "../../../types/Input";
import { GradingResult, GradingState } from "../../../types/Grading";

// ==================== USER DATA TYPES ====================

/**
 * User data for base interactions (highlight, DND, transformation)
 */
export type TextEngineBaseUserData = {
	// For highlight: indices of selected words in parts array
	selectedIndices?: number[];

	// For DND: indices of words placed in target positions
	placedIndices?: number[];

	// For DND: exact word dropped in each target position
	dndPlacements?: Record<number, string>;

	// For transformation: edited text for each target
	transformations?: Record<number, string[]>; // target index -> transformed words
};

/**
 * User data for blanks interactions (fill-in-the-blanks)
 */
export type TextEngineBlanksUserData = {
	// Input values keyed by input element ID
	inputValues: Record<string, any>;
};

/**
 * User data for classification interactions
 */
export type TextEngineClassificationUserData = {
	// Word assignments: word index in parts array -> category name
	wordCategories: Record<number, string>;
};

// ==================== GRADING STATE TYPES ====================
export type TextEngineBaseGradingState = Record<number, GradingState>; // target index -> state
export type TextEngineBlanksGradingState = Record<string, GradingState>; // input ID -> state
export type TextEngineClassificationGradingState = Record<number, GradingState>; // word index -> state

// ==================== BASE GRADERS ====================

/**
 * Grade highlight interaction
 * User must select all and only the target words
 */
export function textEngineHighlightGrader(
	data: TextEngineBaseData,
	userData: TextEngineBaseUserData
): GradingResult {
	const selectedIndices = new Set(userData.selectedIndices ?? []);
	const targetIndices = new Set<number>();

	// Collect all indices that should be selected
	for (const target of data.targets) {
		for (let i = target.startPos; i <= target.endPos; i++) {
			targetIndices.add(i);
		}
	}

	let correctCount = 0; // true positives
	let wrongCount = 0;   // false positives
	let missedCount = 0;  // false negatives

	// Check each position in parts
	for (let i = 0; i < data.parts.length; i++) {
		const shouldBeSelected = targetIndices.has(i);
		const isSelected = selectedIndices.has(i);

		if (shouldBeSelected && isSelected) {
			correctCount++;
		} else if (shouldBeSelected && !isSelected) {
			missedCount++;
		} else if (!shouldBeSelected && isSelected) {
			wrongCount++;
		}
	}

	const total = targetIndices.size;

	// Precision/Recall balance:
	// - Prevents "select all words = 100%"
	// - Still allows free selection without hard caps
	const precision = (correctCount + wrongCount) > 0
		? correctCount / (correctCount + wrongCount)
		: 0;
	const recall = (correctCount + missedCount) > 0
		? correctCount / (correctCount + missedCount)
		: 0;
	const f1 = (precision + recall) > 0
		? (2 * precision * recall) / (precision + recall)
		: 0;
	const score = Math.round(f1 * 100);

	return { score, correct: correctCount, total };
}

/**
 * Grade DND (drag and drop) interaction
 * User must place target words in correct positions
 */
export function textEngineDNDGrader(
	data: TextEngineBaseData,
	userData: TextEngineBaseUserData
): GradingResult {
	const targetIndices = new Set<number>();
	const placements = userData.dndPlacements ?? {};

	// Collect all indices that should be placed
	for (const target of data.targets) {
		for (let i = target.startPos; i <= target.endPos; i++) {
			targetIndices.add(i);
		}
	}

	let correctCount = 0;
	const hasPlacementMap = Object.keys(placements).length > 0;

	if (hasPlacementMap) {
		// Strict grading: placement must match the expected word at that index.
		for (const index of targetIndices) {
			const expected = data.parts[index];
			const actual = placements[index];

			if (!actual) continue;
			if (normalize(actual) === normalize(expected)) {
				correctCount++;
			}
		}
	} else {
		// Backward-compatible fallback for older user state shape.
		const placedIndices = new Set(userData.placedIndices ?? []);
		for (const index of placedIndices) {
			if (targetIndices.has(index)) {
				correctCount++;
			}
		}
	}

	const total = targetIndices.size;
	const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

	return { score, correct: correctCount, total };
}

export function getDNDGradingState(
	data: TextEngineBaseData,
	userData: TextEngineBaseUserData
): TextEngineBaseGradingState {
	const gradingState: TextEngineBaseGradingState = {};
	const placements = userData.dndPlacements ?? {};

	for (const target of data.targets) {
		for (let i = target.startPos; i <= target.endPos; i++) {
			const expected = data.parts[i];
			const actual = placements[i];

			if (!actual) {
				gradingState[i] = 'missed';
			} else if (normalize(actual) === normalize(expected)) {
				gradingState[i] = 'correct';
			} else {
				gradingState[i] = 'wrong';
			}
		}
	}

	return gradingState;
}

/**
 * Grade transformation interaction
 * User must transform target text correctly
 * Comparison is case-insensitive and trimmed
 */
export function textEngineTransformationGrader(
	data: TextEngineBaseData,
	userData: TextEngineBaseUserData,
	expectedTransformations: Record<number, string[]> // target index -> expected transformed words
): GradingResult {
	const userTransformations = userData.transformations ?? {};

	let correctCount = 0;
	let totalCount = 0;

	for (let i = 0; i < data.targets.length; i++) {
		const expected = expectedTransformations[i];
		const actual = userTransformations[i];

		if (!expected) continue;

		totalCount++;

		if (!actual) continue;

		// Compare arrays (case-insensitive, trimmed)
		if (expected.length === actual.length) {
			const matches = expected.every((word, j) =>
				word.toLowerCase().trim() === (actual[j] || '').toLowerCase().trim()
			);

			if (matches) {
				correctCount++;
			}
		}
	}

	const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

	return { score, correct: correctCount, total: totalCount };
}

/**
 * Generate per-target grading state for transformation interaction
 */
export function getTransformationGradingState(
	data: TextEngineBaseData,
	userData: TextEngineBaseUserData,
	expectedTransformations: Record<number, string[]>
): TextEngineBaseGradingState {
	const userTransformations = userData.transformations ?? {};
	const gradingState: TextEngineBaseGradingState = {};

	for (let i = 0; i < data.targets.length; i++) {
		const expected = expectedTransformations[i];
		const actual = userTransformations[i];

		if (!expected) {
			gradingState[i] = 'missed';
			continue;
		}

		if (!actual || actual.length === 0) {
			gradingState[i] = 'missed';
			continue;
		}

		// Compare arrays (case-insensitive, trimmed)
		if (expected.length === actual.length) {
			const matches = expected.every((word, j) =>
				word.toLowerCase().trim() === (actual[j] || '').toLowerCase().trim()
			);
			gradingState[i] = matches ? 'correct' : 'wrong';
		} else {
			gradingState[i] = 'wrong';
		}
	}

	return gradingState;
}

/**
 * Generate per-target grading state for highlight interaction
 */
export function getHighlightGradingState(
	data: TextEngineBaseData,
	userData: TextEngineBaseUserData
): TextEngineBaseGradingState {
	const selectedIndices = new Set(userData.selectedIndices ?? []);
	const targetIndices = new Set<number>();
	const gradingState: TextEngineBaseGradingState = {};

	for (const target of data.targets) {
		for (let i = target.startPos; i <= target.endPos; i++) {
			targetIndices.add(i);
		}
	}

	// Mark word-level grading states:
	// - selected target word => correct
	// - missed target word => missed
	// - selected non-target word => wrong
	for (let i = 0; i < data.parts.length; i++) {
		const isTarget = targetIndices.has(i);
		const isSelected = selectedIndices.has(i);

		if (isTarget && isSelected) gradingState[i] = 'correct';
		else if (isTarget && !isSelected) gradingState[i] = 'missed';
		else if (!isTarget && isSelected) gradingState[i] = 'wrong';
	}

	return gradingState;
}

// ==================== BLANKS GRADER ====================

/**
 * Grade fill-in-the-blanks interaction
 * Compares user input values against expected values for each input element
 */
export function textEngineBlanksGrader(
	data: TextEngineBlanksData,
	userData: TextEngineBlanksUserData
): GradingResult {
	let correctCount = 0;
	let totalCount = data.targets.length;

	for (const target of data.targets) {
		const userValue = userData.inputValues[target.id];
		const expected = target.expectedValue;

		if (compareInputValue(expected, userValue)) {
			correctCount++;
		}
	}

	const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

	return { score, correct: correctCount, total: totalCount };
}

/**
 * Generate per-input grading state for blanks interaction
 */
export function getBlanksGradingState(
	data: TextEngineBlanksData,
	userData: TextEngineBlanksUserData
): TextEngineBlanksGradingState {
	const gradingState: TextEngineBlanksGradingState = {};

	for (const target of data.targets) {
		const userValue = userData.inputValues[target.id];
		const expected = target.expectedValue;

		if (userValue === undefined || userValue === null || userValue === '') {
			gradingState[target.id] = 'missed';
		} else if (compareInputValue(expected, userValue)) {
			gradingState[target.id] = 'correct';
		} else {
			gradingState[target.id] = 'wrong';
		}
	}

	return gradingState;
}

/**
 * Compare user input value against expected InputElementData
 */
function compareInputValue(expected: InputElementData, userValue: any): boolean {
	if (userValue === undefined || userValue === null || userValue === '') {
		return false;
	}

	switch (expected.type) {
		case 'text': {
			const userStr = String(userValue).toLowerCase().trim();
			// Check if user value matches any of the acceptable values
			return expected.value.some(v => v.toLowerCase().trim() === userStr);
		}

		case 'number': {
			const userNum = Number(userValue);
			if (isNaN(userNum)) return false;

			// Check if in targets
			if (expected.targets.includes(userNum)) return true;

			// Check if in any range
			if (expected.ranges) {
				return expected.ranges.some(range =>
					userNum >= range.from && userNum <= range.to
				);
			}

			return false;
		}

		case 'select': {
			const userStr = String(userValue).trim();
			return expected.correctOptions.some(opt =>
				String(opt).trim() === userStr
			);
		}

		case 'date':
		{
			// Accept both parser format (YYYY/MM/DD) and native date input format (YYYY-MM-DD)
			const expectedDate = normalizeDate(String(expected.value));
			const actualDate = normalizeDate(String(userValue));
			return expectedDate.length > 0 && expectedDate === actualDate;
		}

		case 'time': {
			// Normalize both to HH:MM when possible
			const expectedTime = normalizeTime(String(expected.value));
			const actualTime = normalizeTime(String(userValue));
			return expectedTime.length > 0 && expectedTime === actualTime;
		}

		default:
			return false;
	}
}

function normalize(value: string): string {
	return String(value).trim().toLowerCase();
}

function normalizeDate(value: string): string {
	return String(value).trim().replace(/\//g, "-");
}

function normalizeTime(value: string): string {
	const raw = String(value).trim();
	const match = raw.match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
	if (!match) return raw;
	return `${match[1]}:${match[2]}`;
}

// ==================== CLASSIFICATION GRADER ====================

/**
 * Grade classification interaction
 * User must assign each target word to the correct category
 */
export function textEngineClassificationGrader(
	data: TextEngineClassificationData,
	userData: TextEngineClassificationUserData
): GradingResult {
	let correctCount = 0;
	let totalCount = 0;

	// Build a map of word index -> correct category
	const correctCategories = new Map<number, string>();

	for (const categoryTarget of data.targets) {
		for (const target of categoryTarget.targets) {
			for (let i = target.startPos; i <= target.endPos; i++) {
				correctCategories.set(i, categoryTarget.category);
				totalCount++;
			}
		}
	}

	// Check user assignments
	for (const [wordIndex, userCategory] of Object.entries(userData.wordCategories)) {
		const index = Number(wordIndex);
		const correctCategory = correctCategories.get(index);

		if (correctCategory && userCategory === correctCategory) {
			correctCount++;
		}
	}

	const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

	return { score, correct: correctCount, total: totalCount };
}

/**
 * Generate per-word grading state for classification interaction
 */
export function getClassificationGradingState(
	data: TextEngineClassificationData,
	userData: TextEngineClassificationUserData
): TextEngineClassificationGradingState {
	const gradingState: TextEngineClassificationGradingState = {};

	// Build a map of word index -> correct category
	const correctCategories = new Map<number, string>();

	for (const categoryTarget of data.targets) {
		for (const target of categoryTarget.targets) {
			for (let i = target.startPos; i <= target.endPos; i++) {
				correctCategories.set(i, categoryTarget.category);
			}
		}
	}

	// Grade each word
	for (const [index, correctCategory] of correctCategories) {
		const userCategory = userData.wordCategories[index];

		if (!userCategory) {
			gradingState[index] = 'missed';
		} else if (userCategory === correctCategory) {
			gradingState[index] = 'correct';
		} else {
			gradingState[index] = 'wrong';
		}
	}

	return gradingState;
}
