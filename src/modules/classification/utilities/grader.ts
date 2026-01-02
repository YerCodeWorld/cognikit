import { ClassificationData } from "../../../types/Data";
import { GradingResult } from "../../../types/Grading";

export function classificationGrader(correctData: ClassificationData["categories"], userData: Map<string, string>, els): GradingResult {
	let correctCount = 0;
	let totalCount = 0;

	correctData.forEach(category => {
		category.items.forEach(correctItem => {
			totalCount++;
			const userCategory = userData.get(correctItem);
			const el = els.querySelector(`[data-label="${correctItem}"]`);
			if (userCategory === category.label) {
				correctCount++;
				el.chipState = "correct";
			} else el.chipState = "wrong"; 
		});
	});
	
	const score = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
	return { score: score, correct: correctCount, total: totalCount }; 	
}
