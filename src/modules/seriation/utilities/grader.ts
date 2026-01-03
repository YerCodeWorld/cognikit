import { SeriationData } from "../../../types/Data";
import { GradingResult } from "../../../types/Grading";
import { EduChip } from "../../../ui/misc/chip";

/**
 * Grades a seriation/sequencing interaction with partial credit
 *
 * Scoring approach:
 * - Correct position: 100% for that item
 * - Adjacent position (±1): 50% for that item
 * - Further away: 0% for that item
 *
 * @param correctOrder - The correct sequence of items
 * @param userOrder - The user's submitted sequence
 * @param parent - Parent element containing chips (for visual feedback)
 */
export function seriationGrader(
	correctOrder: SeriationData["items"],
	userOrder: string[],
	parent: HTMLElement
): GradingResult {
	let totalScore = 0;
	let correctCount = 0;
	const totalItems = correctOrder.length;

	correctOrder.forEach((correctItem, correctIndex) => {
		const userIndex = userOrder.indexOf(correctItem);
		const chip = parent.querySelector(`[data-item="${correctItem}"]`) as EduChip;

		if (userIndex === -1) {
			// Item not placed (shouldn't happen in complete interaction)
			if (chip) chip.chipState = "wrong";
			return;
		}

		const distance = Math.abs(userIndex - correctIndex);

		if (distance === 0) {
			// Perfect position
			totalScore += 100;
			correctCount++;
			if (chip) chip.chipState = "correct";
		} else if (distance === 1) {
			// Adjacent position - partial credit
			totalScore += 50;
			if (chip) chip.chipState = "missed";
		} else {
			// Wrong position
			if (chip) chip.chipState = "wrong";
		}
	});

	const score = totalItems > 0 ? totalScore / totalItems : 0;

	console.log(`Seriation Score: ${score.toFixed(1)}% (${correctCount}/${totalItems} in correct position)`);

	return {
		score,
		correct: correctCount,
		total: totalItems,
		answerKey: correctOrder,
		userResponse: userOrder
	};
}
