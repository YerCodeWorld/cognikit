// not implemented
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
	return { ok: false, data: null, errors: {} }
}	


