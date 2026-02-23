import {
	TextEngineBaseData,
	TextEngineBlanksData,
	TextEngineClassificationData,
	TextEngineDataUnion
} from "../../../types/Text";
import { ValidationResult } from "../../../types/Global";

/**
 * Validates TextEngineBaseData for highlight/DND/transformation interactions
 *
 * Checks:
 * - Parts array is not empty
 * - Targets array is not empty
 * - Each target has valid words, startPos, endPos
 * - Target positions are within bounds of parts array
 * - Target words match parts at specified positions
 * - Distractors (if present) are non-empty and unique
 */
export function textEngineBaseDataValidator(data: TextEngineBaseData): ValidationResult {
	const errors: Record<string, string> = {};

	// Check 1: Parts must exist
	if (!data.parts || data.parts.length === 0) {
		errors['parts.empty'] = 'No parts found. Text must contain at least one word.';
	}

	// Check 2: Targets must exist
	if (!data.targets || data.targets.length === 0) {
		errors['targets.empty'] = 'No targets found. Text must contain at least one [target] to interact with.';
	}

	// Check 3: Validate each target
	if (data.targets && data.targets.length > 0 && data.parts && data.parts.length > 0) {
		for (let i = 0; i < data.targets.length; i++) {
			const target = data.targets[i];
			const prefix = `targets[${i}]`;

			// Target must have words
			if (!target.words || target.words.length === 0) {
				errors[`${prefix}.words.empty`] = `Target ${i} has no words. Each target must contain at least one word.`;
				continue;
			}

			// Validate positions
			if (target.startPos < 0) {
				errors[`${prefix}.startPos.negative`] = `Target ${i} has negative startPos (${target.startPos}).`;
			}

			if (target.endPos < 0) {
				errors[`${prefix}.endPos.negative`] = `Target ${i} has negative endPos (${target.endPos}).`;
			}

			if (target.startPos > target.endPos) {
				errors[`${prefix}.position.invalid`] =
					`Target ${i} has startPos (${target.startPos}) greater than endPos (${target.endPos}).`;
			}

			// Check if positions are within parts bounds
			if (target.startPos >= data.parts.length) {
				errors[`${prefix}.startPos.outOfBounds`] =
					`Target ${i} startPos (${target.startPos}) is out of bounds (parts length: ${data.parts.length}).`;
			}

			if (target.endPos >= data.parts.length) {
				errors[`${prefix}.endPos.outOfBounds`] =
					`Target ${i} endPos (${target.endPos}) is out of bounds (parts length: ${data.parts.length}).`;
			}

			// Verify target words match parts at specified positions
			if (target.startPos < data.parts.length && target.endPos < data.parts.length) {
				const expectedWordCount = target.endPos - target.startPos + 1;
				if (target.words.length !== expectedWordCount) {
					errors[`${prefix}.words.countMismatch`] =
						`Target ${i} has ${target.words.length} words but position range indicates ${expectedWordCount} words.`;
				}

				// Check if words match
				for (let j = 0; j < target.words.length; j++) {
					const partIndex = target.startPos + j;
					if (partIndex < data.parts.length) {
						const expectedWord = data.parts[partIndex];
						const actualWord = target.words[j];
						if (expectedWord !== actualWord) {
							errors[`${prefix}.words[${j}].mismatch`] =
								`Target ${i} word "${actualWord}" doesn't match part at position ${partIndex}: "${expectedWord}".`;
						}
					}
				}
			}
		}
	}

	// Check 4: Validate distractors (if present)
	if (data.distractors) {
		if (!Array.isArray(data.distractors)) {
			errors['distractors.notArray'] = 'Distractors must be an array.';
		} else {
			if (data.distractors.length === 0) {
				errors['distractors.empty'] = 'Distractors array is empty. Remove distractors field or add at least one distractor.';
			}

			// Check for duplicates
			const seen = new Set<string>();
			for (let i = 0; i < data.distractors.length; i++) {
				const distractor = data.distractors[i];
				if (seen.has(distractor)) {
					errors[`distractors[${i}].duplicate`] = `Duplicate distractor found: "${distractor}".`;
				}
				seen.add(distractor);

				// Check if distractor is empty
				if (!distractor || distractor.trim().length === 0) {
					errors[`distractors[${i}].empty`] = `Distractor at index ${i} is empty.`;
				}
			}
		}
	}

	return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, errors: null };
}

/**
 * Validates TextEngineBlanksData for fill-in-the-blanks interactions
 *
 * Checks:
 * - Parts array is not empty
 * - Targets array is not empty
 * - Each target has valid id and expectedValue
 * - Expected values have proper structure (InputElementData)
 * - No duplicate target IDs
 */
export function textEngineBlanksDataValidator(data: TextEngineBlanksData): ValidationResult {
	const errors: Record<string, string> = {};

	// Check 1: Parts must exist
	if (!data.parts || data.parts.length === 0) {
		errors['parts.empty'] = 'No parts found. Text must contain at least one part.';
	}

	// Check 2: Targets must exist
	if (!data.targets || data.targets.length === 0) {
		errors['targets.empty'] = 'No targets found. Text must contain at least one input element (@tx, @nm, @sl, @dt, @tm).';
	}

	// Track IDs to detect duplicates
	const seenIds = new Set<string>();

	// Check 3: Validate each target
	if (data.targets && data.targets.length > 0) {
		for (let i = 0; i < data.targets.length; i++) {
			const target = data.targets[i];
			const prefix = `targets[${i}]`;

			// Target must have ID
			if (!target.id || target.id.trim().length === 0) {
				errors[`${prefix}.id.empty`] = `Target ${i} has no ID. Each input element must have a unique ID.`;
			} else {
				// Check for duplicate IDs
				if (seenIds.has(target.id)) {
					errors[`${prefix}.id.duplicate`] = `Duplicate ID found: "${target.id}". Each input element must have a unique ID.`;
				}
				seenIds.add(target.id);
			}

			// Target must have expectedValue
			if (!target.expectedValue) {
				errors[`${prefix}.expectedValue.missing`] = `Target ${i} has no expectedValue. Each input element must define expected answer data.`;
				continue;
			}

			const expectedValue = target.expectedValue;

			// Validate expectedValue structure
			if (!expectedValue.type) {
				errors[`${prefix}.expectedValue.type.missing`] = `Target ${i} expectedValue has no type field.`;
			}

			if (!expectedValue.id) {
				errors[`${prefix}.expectedValue.id.missing`] = `Target ${i} expectedValue has no id field.`;
			}

			if (!expectedValue.html) {
				errors[`${prefix}.expectedValue.html.missing`] = `Target ${i} expectedValue has no html field.`;
			}

			// Type-specific validation
			const evType = expectedValue.type;
			if (evType) {
				switch (evType) {
					case 'text':
						if (!('value' in expectedValue) || !Array.isArray((expectedValue as any).value)) {
							errors[`${prefix}.expectedValue.text.value`] =
								`Target ${i} is type 'text' but has no valid 'value' array.`;
						}
						break;
					case 'number':
						if (!('targets' in expectedValue)) {
							errors[`${prefix}.expectedValue.number.targets`] =
								`Target ${i} is type 'number' but has no 'targets' field.`;
						}
						break;
					case 'select':
						if (!('correctOptions' in expectedValue) || !('options' in expectedValue)) {
							errors[`${prefix}.expectedValue.select.options`] =
								`Target ${i} is type 'select' but is missing 'correctOptions' or 'options' fields.`;
						}
						break;
					case 'date':
					case 'time':
						if (!('value' in expectedValue)) {
							errors[`${prefix}.expectedValue.${evType}.value`] =
								`Target ${i} is type '${evType}' but has no 'value' field.`;
						}
						break;
				}
			}
		}
	}

	return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, errors: null };
}

/**
 * Validates TextEngineClassificationData
 *
 * Checks:
 * - Parts array is not empty
 * - Targets array is not empty (at least one category)
 * - Each category target has valid category name and targets array
 * - Category names are unique
 * - Each category has at least one target
 * - Target positions are valid and within bounds
 */
export function textEngineClassificationDataValidator(data: TextEngineClassificationData): ValidationResult {
	const errors: Record<string, string> = {};

	// Check 1: Parts must exist
	if (!data.parts || data.parts.length === 0) {
		errors['parts.empty'] = 'No parts found. Text must contain at least one word.';
	}

	// Check 2: Targets must exist (at least one category)
	if (!data.targets || data.targets.length === 0) {
		errors['targets.empty'] = 'No categories found. Text must contain at least one @ct(category, word) reference.';
	}

	// Track category names to detect duplicates
	const seenCategories = new Set<string>();

	// Check 3: Validate each category
	if (data.targets && data.targets.length > 0) {
		for (let i = 0; i < data.targets.length; i++) {
			const categoryTarget = data.targets[i];
			const prefix = `targets[${i}]`;

			// Category must have a name
			if (!categoryTarget.category || categoryTarget.category.trim().length === 0) {
				errors[`${prefix}.category.empty`] = `Category ${i} has no name.`;
			} else {
				// Check for duplicate category names
				if (seenCategories.has(categoryTarget.category)) {
					errors[`${prefix}.category.duplicate`] =
						`Duplicate category found: "${categoryTarget.category}". Each category must have a unique name.`;
				}
				seenCategories.add(categoryTarget.category);
			}

			// Category must have targets
			if (!categoryTarget.targets || categoryTarget.targets.length === 0) {
				errors[`${prefix}.targets.empty`] =
					`Category "${categoryTarget.category}" has no targets. Each category must contain at least one word.`;
				continue;
			}

			// Validate each target within the category
			for (let j = 0; j < categoryTarget.targets.length; j++) {
				const target = categoryTarget.targets[j];
				const targetPrefix = `${prefix}.targets[${j}]`;

				// Target must have words
				if (!target.words || target.words.length === 0) {
					errors[`${targetPrefix}.words.empty`] =
						`Category "${categoryTarget.category}" target ${j} has no words.`;
					continue;
				}

				// Validate positions
				if (target.startPos < 0) {
					errors[`${targetPrefix}.startPos.negative`] =
						`Category "${categoryTarget.category}" target ${j} has negative startPos.`;
				}

				if (target.endPos < 0) {
					errors[`${targetPrefix}.endPos.negative`] =
						`Category "${categoryTarget.category}" target ${j} has negative endPos.`;
				}

				if (target.startPos > target.endPos) {
					errors[`${targetPrefix}.position.invalid`] =
						`Category "${categoryTarget.category}" target ${j} has startPos greater than endPos.`;
				}

				// Check if positions are within parts bounds
				if (data.parts && data.parts.length > 0) {
					if (target.startPos >= data.parts.length) {
						errors[`${targetPrefix}.startPos.outOfBounds`] =
							`Category "${categoryTarget.category}" target ${j} startPos is out of bounds.`;
					}

					if (target.endPos >= data.parts.length) {
						errors[`${targetPrefix}.endPos.outOfBounds`] =
							`Category "${categoryTarget.category}" target ${j} endPos is out of bounds.`;
					}

					// Verify words match parts
					if (target.startPos < data.parts.length && target.endPos < data.parts.length) {
						const expectedWordCount = target.endPos - target.startPos + 1;
						if (target.words.length !== expectedWordCount) {
							errors[`${targetPrefix}.words.countMismatch`] =
								`Category "${categoryTarget.category}" target ${j} word count mismatch.`;
						}
					}
				}
			}
		}
	}

	return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, errors: null };
}

/**
 * Unified validator that routes to the appropriate validator based on data type
 */
export function textEngineDataValidator(data: TextEngineDataUnion): ValidationResult {
	switch (data.type) {
		case 'base':
			return textEngineBaseDataValidator(data);
		case 'blanks':
			return textEngineBlanksDataValidator(data);
		case 'classification':
			return textEngineClassificationDataValidator(data);
		default:
			return {
				ok: false,
				errors: { 'type.invalid': `Unknown text engine type: ${(data as any).type}` }
			};
	}
}
