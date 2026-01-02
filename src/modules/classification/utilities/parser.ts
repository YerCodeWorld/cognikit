import { extractDistractors } from "../../../shared/utils";
import { ParsingResult } from "../../../shared";
import { InteractionData, ClassificationData } from "../../../types/Data";

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

		const result: InteractionData = {
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


