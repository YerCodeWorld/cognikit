import { ValidationResult } from "../../../shared";
import { SeriationData } from "../../../types/Data";

export function seriationValidator(data: SeriationData): ValidationResult {
	const errors: Record<string, string> = {};

	console.log(data, 123);

	if (!data) {
		errors['data'] = 'Data is required';
		return { ok: false, errors };
	}

	if (data.type !== 'seriation') {
		errors['type'] = 'Data type must be "seriation"';
	}

	if (!Array.isArray(data.items)) {
		errors['items'] = 'Items must be an array';
		return { ok: false, errors };
	}

	if (data.items.length < 2) {
		console.log(1234);
		errors['items'] = 'At least 2 items are required for seriation';
	}

	if (data.items.some(item => typeof item !== 'string' || item.trim() === '')) {
		errors['items'] = 'All items must be non-empty strings';
	}

	const uniqueItems = new Set(data.items);
	if (uniqueItems.size !== data.items.length) {
		errors['items'] = 'All items must be unique (duplicates found)';
	}
	
	console.log(123);

	const ok = Object.keys(errors).length === 0;
	return { ok, errors: ok ? null : errors };
}
