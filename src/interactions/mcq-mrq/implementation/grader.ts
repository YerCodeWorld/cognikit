import { GradingResult } from "../../../types/Grading";
import { RecognitionData } from "../../../types/Data";

/**
 * User's answers for MCQ/MRQ
 * Format: { "question text": ["selected option 1", "selected option 2", ...] }
 */
export type RecognitionAnswers = Record<string, string[]>;

/**
 * Grader for MCQ/MRQ interactions
 *
 * Grading logic per question:
 * - Each correct option selected: +1 point
 * - Each incorrect option selected: -1 point (penalty)
 * - Each correct option NOT selected (missed): -1 point (penalty)
 * - Score is (correct selections - wrong selections - missed) / total correct options
 * - Rounded to whole number percentage
 *
 * Overall score: average of all question scores
 */
export function recognitionGrader(
	data: RecognitionData,
	userAnswers: RecognitionAnswers
): GradingResult {
	let totalScore = 0;
	const questionCount = data.data.length;

	// Grade each question
	data.data.forEach(question => {
		const correctOptions = new Set(question.correctOptions);
		const userSelected = new Set(userAnswers[question.question] || []);

		let correctSelections = 0;
		let wrongSelections = 0;
		let missedCorrect = 0;

		// Check each option the user selected
		userSelected.forEach(selected => {
			if (correctOptions.has(selected)) {
				correctSelections++;
			} else {
				wrongSelections++;
			}
		});

		// Check for missed correct options
		correctOptions.forEach(correct => {
			if (!userSelected.has(correct)) {
				missedCorrect++;
			}
		});

		// Calculate question score
		const totalCorrect = correctOptions.size;
		const rawScore = correctSelections - wrongSelections - missedCorrect;
		const questionScore = Math.max(0, (rawScore / totalCorrect) * 100);

		totalScore += questionScore;
	});

	// Calculate overall score (average of all questions)
	const score = Math.round(totalScore / questionCount);

	// Count how many questions were fully correct
	let fullyCorrectCount = 0;
	data.data.forEach(question => {
		const correctOptions = new Set(question.correctOptions);
		const userSelected = new Set(userAnswers[question.question] || []);

		// Check if sets are equal
		if (
			correctOptions.size === userSelected.size &&
			[...correctOptions].every(opt => userSelected.has(opt))
		) {
			fullyCorrectCount++;
		}
	});

	return {
		score,
		correct: fullyCorrectCount,
		total: questionCount
	};
}
