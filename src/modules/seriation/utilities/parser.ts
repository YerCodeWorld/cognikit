import { ParsingResult } from "../../../shared";
import { SeriationData } from "../../../types/Data";

/**
 * Parses a simple DSL for seriation data
 *
 * Format: Items separated by pipes (|) or newlines
 *
 * Example 1 (pipe-separated):
 * ```
 * Egg | Caterpillar | Chrysalis | Butterfly
 * ```
 *
 * Example 2 (numbered):
 * ```
 * 1. American Revolution
 * 2. French Revolution
 * 3. Industrial Revolution
 * 4. World War I
 * ```
 *
 * Example 3 (with assets):
 * ```
 * @:step1 | @:step2 | @:step3 | Final Product
 * ```
 */
export function seriationParser(code: string): ParsingResult {
	try {
		if (!code || typeof code !== 'string') {
			return {
				ok: false,
				errors: { 'input': 'Input must be a non-empty string' }
			};
		}

		const trimmed = code.trim();
		if (trimmed.length === 0) {
			return {
				ok: false,
				errors: { 'input': 'Input cannot be empty' }
			};
		}

		let items: string[] = [];

		// Check if pipe-separated format
		if (trimmed.includes('|')) {
			items = trimmed
				.split('|')
				.map(item => item.trim())
				.filter(item => item.length > 0);
		} else {
			// Newline-separated format (with optional numbering)
			items = trimmed
				.split('\n')
				.map(line => {
					// Remove leading numbers like "1.", "2)", "a.", etc.
					return line.replace(/^\s*[\d\w]+[\.\)]\s*/, '').trim();
				})
				.filter(item => item.length > 0);
		}

		if (items.length < 2) {
			return {
				ok: false,
				errors: { 'items': 'At least 2 items are required for seriation' }
			};
		}

		const result: SeriationData = {
			type: 'seriation',
			items
		};

		return { ok: true, data: result };

	} catch (err) {
		return {
			ok: false,
			errors: { 'Parse Error': `${err instanceof Error ? err.message : String(err)}` }
		};
	}
}
