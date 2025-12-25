import { extractDistractors } from "../utils";
import { ItemData, ClassificationData, ParsingResult, ValidationResult } from "../../shared";
import { GradingResult } from "../../types/Grading";

/**
 * Example
 * ---
 * RED FRUITS =  apple | strawberry | cherry;
 * Yellow Fruits = banana | pineapple | mango;
 * Green Fruits = watermelon | avocado;
 * = coconut | eggplant;
 * ---
 */
export function classificationParser(code: string): ParsingResult {
	try {
		const r = extractDistractors(code);
		if (!r.ok) return { ok: false, errors: r.errors };

		const distractors = r.data.content || [];
		const cleanCode = r.data.remain || code;	

		const categoryPattern = /(\w+)\s*=\s*(.+)$/m;
		const categories: ClassificationData["categories"] = [];

		let match;
		while ((match = categoryPattern.exec(cleanCode)) !== null) {
			const categoryName = match[1].trim();
			const itemsString = match[2].trim();
			
			const words = itemsString
				.split('|')
				.map(item => item.trim())
				.filter(item => item.length > 0);

			categories.push({
				label: categoryName,
				items: words
			});
		}

		const result: ItemData = {
			type: 'classification',
			categories,
			distractors
		}

		return { ok: true, data: result };

	} catch (err) {
		return {  
			ok: false,
			errors: { 'Parse Error': `${err instanceof Error ? err.message : String(err)}` }
		};
	}
}	

export function classificationValidator(data: ClassificationData): ValidationResult {
	return { ok: false, errors: { 'none': '' } }
}

// still sketch-like
export function classificationGrading(correctData: ClassificationData["categories"], userData: Map<string, string>): GradingResult {
	let correctCount = 0;
	let totalCount = 0;

	correctData.forEach(category => {
		category.items.forEach(correctItem => {
			totalCount++;
			const userCategory = userData.get(correctItem);
			if (userCategory === category.label) {
				correctCount++;
			}
		});
	});
	
	const score = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
	return { score: score, correct: correctCount, total: totalCount }; 	
}
