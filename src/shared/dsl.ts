import { GrammarParseResult, GrammarParser } from "../types/Global";
import { TextData, NumberData, SelectData, DateData, TimeData } from "../types/Input";
import { splitByPipes, dedupe, shuffle, hash } from "./utils";
// ===============================================

// These might be useful
const MCQ_PATTERN = /\[([^\]]+)\]/g;
const NUMBER_PATTERN = /^\s*(-?\d+)\s*(\.\.)\s*(-?\d+)\s*$/;
const DATE_PATTERN = /^\d{4}\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// =================================================

export const parseTX: GrammarParser<TextData> = (s: string): GrammarParseResult<TextData> => {

	const tokens: string[] = splitByPipes(s);
	if (tokens.length === 0 || tokens.some(t => !t)) {
		return {
			ok: false,
			data: null,
			errors: { "@tx": "provide at least one non-empty answer." } 
		}
	}

	const value = dedupe(tokens);

	const id = `text-${hash(s)}`;
	// is there a way to enforce a variant here? Maybe do a replace to the innerHTML in whatever implementation uses this
	let html = `<edu-input type="text" id="${id}"variant="elegant" autocomplete="off"></edu-input>`;
	
	return {
		ok: true,
		data: {
			type: 'text',
			id,
			value,	
			html	
		},
		errors: null
	}

}

export const parseSL: GrammarParser<SelectData> = (s: string): GrammarParseResult<SelectData> => {
		
	const bracketMatches = [...s.matchAll(MCQ_PATTERN)];
	const correctOptions = bracketMatches.flatMap(m => splitByPipes(m[1]));

	const cleaned = s.replace(/\[|\]/g, "");
	const options = [" ", ...shuffle(dedupe(splitByPipes(cleaned)))];

	if (options.length === 0) {
		return {
			ok: false,
			data: null,
			errors: { "@sl": "provide at least one option for the select." }
		}
	} 

	if (correctOptions.length === 0) {
		return {
			ok: false,
			data: null,
			errors: { "@sl": "Mark at least one correct option inside of square brackets." }
		}
	}

	const allOptions = [...options];

	const id = `select-${hash(s)}-${Math.random().toString(36).slice(2)}}`;

	const optsElementsHTML = allOptions.map(o => `<option>${o}</option>`).join("");
	const html = `<edu-input as="select" id="${id}" variant="elegant">${optsElementsHTML}</edu-input>`;

	return {
		ok: true,
		data: {
			type: "select",
			id,
			correctOptions,
			options,
			html
		},
		errors: null
	}

}

export const parseNM: GrammarParser<NumberData> = (s: string): GrammarParseResult<NumberData> => {
	const tokens = splitByPipes(s);
	if (tokens.length === 0 || tokens.some(t => !t.trim())) { 
		return {
			ok: false,
			data: null,
			errors: { "@nm": "provide at least one non-empty option." } 
		}
	} 

	const values: number[] = [];
	const ranges: { from: number; to: number }[] = [];

	for (const t of tokens) {
		const m = t.match(NUMBER_PATTERN);
		if (m) {
			const from = parseInt(m[1], 10);
			const to = parseInt(m[3], 10);
			if (Number.isNaN(from) || Number.isNaN(to) || (from > to)) {
				return {
					ok: false,
					data: null,
					errors: { "@nm": "Invalid range ${t}" }
				}
			}
			ranges.push({ from, to });
		} else {
			const n = Number(t.trim());
			if (!Number.isInteger(n)) {
				return {
					ok: false,
					data: null,
					errors: { "@nm": "${t} is not an integer." }
				}
			}
			values.push(n);
		}
	}

	const id = `number-${hash(s)}-${Math.random().toString(36).slice(2)}`;
	const html = `<edu-input type="number" variant="elegant" id="${id}"></edu-input>`;

	return {
		ok: true,
		data: {
			type: "number",
			id,
			targets: dedupe(values),
			ranges,
			html
		},
		errors: null
	}
}

export const parseDT: GrammarParser<DateData> = (s: string): GrammarParseResult<DateData> => {
	const tokens = splitByPipes(s);

	if (tokens.length === 0 || tokens.some(t => !t.trim())) {
		return {
			ok: false,
			data: null,
			errors: { "@dt": "provide at least one non-empty date option." }
		}
	}

	// Validate all tokens are valid dates (YYYY/MM/DD format)
	const validDates: string[] = [];
	for (const token of tokens) {
		const trimmed = token.trim();
		if (!DATE_PATTERN.test(trimmed)) {
			return {
				ok: false,
				data: null,
				errors: { "@dt": `"${trimmed}" is not a valid date. Expected format: YYYY/MM/DD` }
			}
		}
		validDates.push(trimmed);
	}

	const value = dedupe(validDates);
	const id = `date-${hash(s)}`;
	const html = `<edu-input type="date" id="${id}" variant="elegant"></edu-input>`;

	return {
		ok: true,
		data: {
			type: 'date',
			id,
			value: value[0], // For date, we typically expect one correct value
			html
		},
		errors: null
	}
}

export const parseTM: GrammarParser<TimeData> = (s: string): GrammarParseResult<TimeData> => {
	const tokens = splitByPipes(s);

	if (tokens.length === 0 || tokens.some(t => !t.trim())) {
		return {
			ok: false,
			data: null,
			errors: { "@tm": "provide at least one non-empty time option." }
		}
	}

	// Validate all tokens are valid times (HH:MM format)
	const validTimes: string[] = [];
	for (const token of tokens) {
		const trimmed = token.trim();
		if (!TIME_PATTERN.test(trimmed)) {
			return {
				ok: false,
				data: null,
				errors: { "@tm": `"${trimmed}" is not a valid time. Expected format: HH:MM (24-hour)` }
			}
		}
		validTimes.push(trimmed);
	}

	const value = dedupe(validTimes);
	const id = `time-${hash(s)}`;
	const html = `<edu-input type="time" id="${id}" variant="elegant"></edu-input>`;

	return {
		ok: true,
		data: {
			type: 'time',
			id,
			value: value[0], // For time, we typically expect one correct value
			html
		},
		errors: null
	}
}

// =================================================
// not really solid I guess
export function isInteractionSequential(s: string): boolean {
	return s.split(';;').length > 0;
}

// same here
export function splitByDoubleSemiColon(s: string): string[] {
	return s.trim().split(";;");
}
