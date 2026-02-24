import { AssociationData } from "../../../types/Data";
import { GradingResult } from "../../../types/Grading";
import { EduChip } from "../../../ui/misc/chip";

export function associationDataGrader(
	answerKey: AssociationData["pairs"], userData: Map<string, string>, parent: any 
): GradingResult {

	let correct = 0;

	for (const [l, r] of userData.entries()) {
		const chip = parent.querySelector(`[data-val="${l}"]`) as EduChip;
		const correctPair = answerKey.find(p => p.left === l);
		if (correctPair && correctPair.right === r) {
			chip.chipState = "correct";
			correct++;
		} else chip.chipState ="wrong";
	}

	const total = answerKey.length;
	const score = total > 0 ? (correct / total) * 100 : 0;
	console.log(`Association Score: ${score.toFixed(1)}% (${correct}/${total} correct)`);

	return { score, correct, total, answerKey, userResponse: userData };
}
