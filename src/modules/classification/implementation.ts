import { ClassificationData, ParsingResult, ValidationResult } from "../../shared";

/**
 * Example
 * ---
 * RED FRUITS =  apple | strawberry | cherry;
 * Yellow Fruits = banana | pineapple | mango;
 * Green Fruits = watermelon | avocado;
 * = coconut | eggplant;
 * ---
 */
export const classificationParser(code: string): ParsingResult {
	try {
		const r: string = extractDistractors(code);
		if (!r.ok) return { ok: false, r.errors };

		const distractors = r.data.content || [];
		const cleanCode = r.data.remain || code;	

		const categoryPatten = /(\w+)\s*=\s*(.+)$/m); 
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

		const result: ClassificationData = {
			categories,
			distractors
		}

		return { ok: true, data: result };

	} catch (err) {
		return {  
			ok: false,
			errors: { 'Parse Error', `${error instanceof Error ? error.message : String(error)}` }
		};
	}
}	

export const classficiationValidator(data: ClassificationData): ValidationResult {}
