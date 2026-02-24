import { RecognitionData } from "../../../types/Data";

type ValidationResult = {
	ok: boolean;
	errors?: Record<string, string>;
};

/**
 * Validator for MCQ/MRQ recognition data
 *
 * Validates:
 * - At least one question exists
 * - Each question has at least one correct answer
 * - Each question has at least two total options
 * - No duplicate options within a question
 * - Question text is not empty
 */
export function recognitionValidator(data: RecognitionData): ValidationResult {
	const errors: Record<string, string> = {};

	// Check if questions exist
	if (!data.data || data.data.length === 0) {
		errors['validation.noQuestions'] =
			'No questions found. Expected at least one question with format: # question\\n[correct] | incorrect;';
		return { ok: false, errors };
	}

	// Validate each question
	data.data.forEach((q, index) => {
		const qNum = index + 1;

		// Question text must not be empty
		if (!q.question || q.question.trim() === '') {
			errors[`validation.emptyQuestion.q${qNum}`] =
				`Question ${qNum}: Question text cannot be empty.`;
		}

		// Must have at least one correct option
		if (!q.correctOptions || q.correctOptions.length === 0) {
			errors[`validation.noCorrectOptions.q${qNum}`] =
				`Question ${qNum}: Must have at least one correct answer. Use [correct] syntax.`;
		}

		// Must have at least two total options
		if (!q.options || q.options.length < 2) {
			errors[`validation.insufficientOptions.q${qNum}`] =
				`Question ${qNum}: Must have at least 2 options (correct and incorrect).`;
		}

		// Check for empty options
		if (q.options) {
			q.options.forEach((opt, optIndex) => {
				if (!opt || opt.trim() === '') {
					errors[`validation.emptyOption.q${qNum}.opt${optIndex + 1}`] =
						`Question ${qNum}, Option ${optIndex + 1}: Option text cannot be empty.`;
				}
			});
		}

		// Verify all correct options are in the options array
		if (q.correctOptions && q.options) {
			q.correctOptions.forEach(correct => {
				if (!q.options.includes(correct)) {
					errors[`validation.missingCorrectOption.q${qNum}`] =
						`Question ${qNum}: Correct option "${correct}" not found in options array.`;
				}
			});
		}

		// Check for duplicate options
		if (q.options) {
			const seen = new Set<string>();
			q.options.forEach(opt => {
				if (seen.has(opt)) {
					errors[`validation.duplicateOption.q${qNum}`] =
						`Question ${qNum}: Duplicate option "${opt}" found.`;
				}
				seen.add(opt);
			});
		}
	});

	return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true };
}
