import { RecognitionData } from "../../../types/Data";

type ParseResult = {
	data: RecognitionData;
	errors?: Record<string, string>;
};

/**
 * Parser for MCQ/MRQ grammar
 *
 * Grammar:
 * # question
 * [correct1 | correct2] | incorrect1 | incorrect2;
 *
 * Rules:
 * - '#' indicates a question
 * - '[...]' contains correct options separated by '|'
 * - Options outside brackets are incorrect
 * - Lines must end with ';'
 * - '@:assetName' for asset references (preserved as-is)
 */
export function recognitionParser(code: string): ParseResult {
	const questions: Array<{ question: string; correctOptions: string[]; options: string[] }> = [];
	const errors: Record<string, string> = {};

	// Split into lines and process
	const lines = code.split('\n').map(line => line.trim()).filter(Boolean);

	let currentQuestion: string | null = null;
	let questionIndex = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Question line (starts with #)
		if (line.startsWith('#')) {
			currentQuestion = line.substring(1).trim();
			questionIndex++;
			continue;
		}

		// Options line (must end with ;)
		if (line.endsWith(';')) {
			if (!currentQuestion) {
				errors[`parse.noQuestion.line${i + 1}`] =
					`Line ${i + 1}: Found options without a preceding question (# question).`;
				continue;
			}

			// Remove trailing semicolon
			const optionsLine = line.slice(0, -1).trim();

			// Extract correct options from brackets [...]
			const correctMatch = optionsLine.match(/\[([^\]]+)\]/);
			let correctOptions: string[] = [];
			let remainingLine = optionsLine;

			if (correctMatch) {
				const correctStr = correctMatch[1];
				correctOptions = correctStr
					.split('|')
					.map(opt => opt.trim())
					.filter(Boolean);

				// Remove the bracketed section from the line
				remainingLine = optionsLine.replace(/\[([^\]]+)\]/, '').trim();
			}

			// Extract incorrect options (everything outside brackets)
			const incorrectOptions = remainingLine
				.split('|')
				.map(opt => opt.trim())
				.filter(Boolean);

			// Combine all options
			const allOptions = [...correctOptions, ...incorrectOptions];

			// Validation: check for duplicates
			const seen = new Set<string>();
			for (const opt of allOptions) {
				if (seen.has(opt)) {
					errors[`parse.duplicate.q${questionIndex}`] =
						`Question ${questionIndex}: Duplicate option "${opt}" found.`;
					break;
				}
				seen.add(opt);
			}

			// Add the parsed question
			questions.push({
				question: currentQuestion,
				correctOptions,
				options: allOptions
			});

			// Reset for next question
			currentQuestion = null;
		} else {
			errors[`parse.missingSemicolon.line${i + 1}`] =
				`Line ${i + 1}: Options line must end with ';'.`;
		}
	}

	// Check for dangling question
	if (currentQuestion) {
		errors['parse.danglingQuestion'] =
			`Question "${currentQuestion}" has no options defined.`;
	}

	const data: RecognitionData = {
		type: 'recognition',
		data: questions
	};

	return Object.keys(errors).length > 0 ? { data, errors } : { data };
}
