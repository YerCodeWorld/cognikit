import { parseTX, parseSL, parseNM, parseDT, parseTM } from "../../../shared/dsl";
import { splitByDoubleSemiColon } from "../../../shared/dsl";

import { 
	TextEngineDataUnion,
	TextEngineModality, 
	TextEngineBaseData, 
	TextEngineBlanksData, 
	TextEngineClassificationData, 
	TextEngineSequentialInteractionData 
} from "../../../types/Text";

import { InputElementReference, InputElementData } from "../../../types/Input";
import { TextEngineBaseDataTarget, TextEngineBlanksDataTarget, TextEngineClassificationDataTarget } from "../../../types/Text";
import { SimpleErrorObject, ComplexErrorObject, GrammarParser, GrammarParseResult } from "../../../types/Global";

const ELEMENT_REFERENCE = ['tx', 'nm', 'sl', 'dt', 'tm'] as const;
const ELEMENT_REFERENCE_MAP = {
	tx: parseTX,
	nm: parseNM,
	sl: parseSL,
	dt: parseDT,
	tm: parseTM
}

export const textEngineBaseGrammarParser: GrammarParser<TextEngineBaseData> = (code: string): GrammarParseResult<TextEngineBaseData> => {

	const parts: string[] = [];
	const targets: TextEngineBaseDataTarget[] = [];
	const errors: SimpleErrorObject = {};
	let distractors: string[] | undefined = undefined;

	// Check for distractors pattern: = [distractor1 | distractor2 | ...];
	const distractorPattern = /^\s*=\s*\[([^\]]+)\]\s*;/m;
	const distractorMatch = code.match(distractorPattern);

	if (distractorMatch) {
		// Extract distractors
		const distractorContent = distractorMatch[1];
		distractors = distractorContent
			.split('|')
			.map(d => d.trim().replace(/^["']|["']$/g, '')) // Remove quotes if present
			.filter(Boolean);

		// Remove the distractor line from the code
		code = code.replace(distractorPattern, '');
	}

	let currentWord = "";
	let inTarget = false;
	let currentTarget: TextEngineBaseDataTarget | null = null;

	let i = 0;
	while (i < code.length) {

		const curr = code[i];

		// Handle escaped brackets [[ -> [
		if (i + 1 < code.length && curr === "[" && code[i + 1] === "[") {
			currentWord += "[";
			i += 2;
			continue;
		}

		// Opening bracket - start a target
		if (curr === "[") {
			// Save any accumulated word before the bracket
			if (currentWord.trim().length > 0) {
				parts.push(currentWord.trim());
				currentWord = "";
			}

			inTarget = true;
			currentTarget = {
				words: [],
				startPos: parts.length,
				endPos: parts.length
			};
			i++;
			continue;
		}

		// Closing bracket - end a target
		if (curr === "]") {
			if (!inTarget) {
				errors[`at:${i}`] = "Unexpected closing bracket ']' without matching opening bracket.";
				i++;
				continue;
			}

			// Save the last word in the target
			if (currentWord.trim().length > 0) {
				const word = currentWord.trim();
				currentTarget!.words.push(word);
				parts.push(word);
				currentWord = "";
			}

			// Finalize the target
			if (currentTarget!.words.length === 0) {
				errors[`at:${i}`] = "Empty brackets [] are not allowed as targets.";
			} else {
				currentTarget!.endPos = parts.length - 1;
				targets.push(currentTarget!);
			}

			currentTarget = null;
			inTarget = false;
			i++;
			continue;
		}

		// Space/newline/tab - word boundary
		if (curr === " " || curr === "\n" || curr === "\t" || curr === "\r") {
			if (currentWord.trim().length > 0) {
				const word = currentWord.trim();

				if (inTarget) {
					currentTarget!.words.push(word);
				}

				parts.push(word);
				currentWord = "";
			}
			i++;
			continue;
		}

		// Regular character
		currentWord += curr;
		i++;
	}

	// Handle any remaining word
	if (currentWord.trim().length > 0) {
		const word = currentWord.trim();

		if (inTarget) {
			currentTarget!.words.push(word);
			currentTarget!.endPos = parts.length;
			targets.push(currentTarget!);
		}

		parts.push(word);
	}

	// Check for unclosed brackets
	if (inTarget) {
		errors['unclosed'] = "Unclosed opening bracket '['. Expected ']'.";
	}

	const hasErrors = Object.keys(errors).length > 0;

	return {
		ok: !hasErrors,
		data: {
			type: 'base',
			parts,
			targets,
			...(distractors && { distractors })
		},
		errors: hasErrors ? errors : null
	}

}

// Blanks parser - parts include words AND generated HTML elements
// Example: "I @tx(am) someone" -> parts: ["I", "<edu-input.../>", "someone"]
export const textEngineBlanksGrammarParser: GrammarParser<TextEngineBlanksData> = (code: string): GrammarParseResult<TextEngineBlanksData> => {
	const errors: SimpleErrorObject = {};
	const parts: string[] = [];
	const targets: TextEngineBlanksDataTarget[] = [];

	let currentWord = "";
	let i = 0;

	while (i < code.length) {

		const curr = code[i];

		// Handle escaped @@ -> @
		if (i + 1 < code.length && curr === "@" && code[i + 1] === "@") {
			currentWord += "@";
			i += 2;
			continue;
		}

		// If not @, check for space or accumulate
		if (curr !== "@") {
			// Space/newline/tab - word boundary
			if (curr === " " || curr === "\n" || curr === "\t" || curr === "\r") {
				if (currentWord.trim().length > 0) {
					parts.push(currentWord.trim());
					currentWord = "";
				}
				i++;
				continue;
			}

			// Regular character
			currentWord += curr;
			i++;
			continue;
		}

		// We found an @ - save any accumulated word
		if (currentWord.trim().length > 0) {
			parts.push(currentWord.trim());
			currentWord = "";
		}

		const currentPos = i;
		i++; // move past the @

		// Parse the reference (tx, nm, sl, dt, tm)
		let ref = "";
		while (i < code.length && /[a-z]/i.test(code[i])) {
			ref += code[i++];
		}

		// Validate reference
		if (!ref || !(ELEMENT_REFERENCE as readonly string[]).includes(ref)) {
			errors[`at:${currentPos}`] = `Invalid element reference "@${ref}". Expected one of: ${ELEMENT_REFERENCE.join(', ')}.`;
			continue;
		}

		// Expect opening parenthesis
		if (i >= code.length || code[i] !== "(") {
			errors[`at:${currentPos}`] = `Expected '(' after @${ref} at position ${i}.`;
			continue;
		}
		i++; // move past the (

		// Parse the content inside parentheses
		let parenContent = "";
		let closed = false;
		while (i < code.length) {
			if (code[i] === ")") {
				closed = true;
				i++;
				break;
			}
			parenContent += code[i++];
		}

		if (!closed) {
			errors[`at:${currentPos}`] = `Unclosed parenthesis for @${ref}. Expected ')'.`;
			continue;
		}

		const parser: GrammarParser<InputElementData> = ELEMENT_REFERENCE_MAP[ref as keyof typeof ELEMENT_REFERENCE_MAP];

		if (!parser) {
			errors[`at:${currentPos}`] = `No parser found for @${ref}.`;
			continue;
		}

		// Parse the content
		const result: GrammarParseResult<InputElementData> = parser(parenContent);

		if (!result.ok) {
			errors[`at:${currentPos}`] = result.errors ? JSON.stringify(result.errors) : `Failed to parse @${ref}(${parenContent})`;
			continue;
		}

		// Add the generated HTML as a single part (NOT split by words)
		parts.push(result.data!.html);

		// Build the target
		const target: TextEngineBlanksDataTarget = {
			id: result.data!.id,
			expectedValue: result.data!
		};

		targets.push(target);
	}

	// Add any remaining word
	if (currentWord.trim().length > 0) {
		parts.push(currentWord.trim());
	}

	const hasErrors = Object.keys(errors).length > 0;

	return {
		ok: !hasErrors,
		data: {
			type: "blanks",
			parts,
			targets
		},
		errors: hasErrors ? errors : null
	}
}

// Classification parser for @ct(category, word) syntax
// Splits by words like base parser, tracks which words belong to which categories
export const textEngineClassificationGrammarParser: GrammarParser<TextEngineClassificationData> =
	(code: string): GrammarParseResult<TextEngineClassificationData> => {

	const parts: string[] = [];
	const errors: SimpleErrorObject = {};
	const categoryMap = new Map<string, TextEngineBaseDataTarget[]>();

	let currentWord = "";
	let i = 0;

	while (i < code.length) {
		const curr = code[i];

		// Handle escaped @@ -> @
		if (i + 1 < code.length && curr === "@" && code[i + 1] === "@") {
			currentWord += "@";
			i += 2;
			continue;
		}

		// If not @, check for space or accumulate
		if (curr !== "@") {
			// Space/newline/tab - word boundary
			if (curr === " " || curr === "\n" || curr === "\t" || curr === "\r") {
				if (currentWord.trim().length > 0) {
					parts.push(currentWord.trim());
					currentWord = "";
				}
				i++;
				continue;
			}

			// Regular character
			currentWord += curr;
			i++;
			continue;
		}

		// We found an @ - save any accumulated word
		if (currentWord.trim().length > 0) {
			parts.push(currentWord.trim());
			currentWord = "";
		}

		const currentPos = i;
		i++; // move past the @

		// Parse 'ct'
		let ref = "";
		while (i < code.length && /[a-z]/i.test(code[i])) {
			ref += code[i++];
		}

		// Validate it's 'ct'
		if (ref !== 'ct') {
			errors[`at:${currentPos}`] = `Invalid reference "@${ref}". Expected "@ct" for classification.`;
			continue;
		}

		// Expect opening parenthesis
		if (i >= code.length || code[i] !== "(") {
			errors[`at:${currentPos}`] = `Expected '(' after @ct at position ${i}.`;
			continue;
		}
		i++; // move past the (

		// Parse the content inside parentheses: category, word(s)
		let parenContent = "";
		let closed = false;
		while (i < code.length) {
			if (code[i] === ")") {
				closed = true;
				i++;
				break;
			}
			parenContent += code[i++];
		}

		if (!closed) {
			errors[`at:${currentPos}`] = `Unclosed parenthesis for @ct. Expected ')'.`;
			continue;
		}

		// Split by comma to get category and word(s)
		const commaParts = parenContent.split(',').map(p => p.trim());
		if (commaParts.length !== 2) {
			errors[`at:${currentPos}`] = `Invalid @ct syntax. Expected: @ct(category, word). Got: @ct(${parenContent})`;
			continue;
		}

		const [category, wordOrPhrase] = commaParts;

		if (!category || !wordOrPhrase) {
			errors[`at:${currentPos}`] = `Category and word cannot be empty in @ct(${parenContent}).`;
			continue;
		}

		// Split the phrase into words (in case it's multi-word like "tired of")
		const words = wordOrPhrase.split(/\s+/).filter(Boolean);
		const startPos = parts.length;

		// Add all words to parts
		for (const word of words) {
			parts.push(word);
		}

		const endPos = parts.length - 1;

		const target: TextEngineBaseDataTarget = {
			words,
			startPos,
			endPos
		};

		// Group by category
		if (!categoryMap.has(category)) {
			categoryMap.set(category, []);
		}
		categoryMap.get(category)!.push(target);
	}

	// Add any remaining word
	if (currentWord.trim().length > 0) {
		parts.push(currentWord.trim());
	}

	// Convert map to target array
	const targets: TextEngineClassificationDataTarget[] = [];
	for (const [category, categoryTargets] of categoryMap.entries()) {
		targets.push({
			category,
			targets: categoryTargets
		});
	}

	const hasErrors = Object.keys(errors).length > 0;

	return {
		ok: !hasErrors,
		data: {
			type: 'classification',
			parts,
			targets
		},
		errors: hasErrors ? errors : null
	}
}

const TEXT_ENGINE_PARSER_MAP = {
	base: textEngineBaseGrammarParser,
	blanks: textEngineBlanksGrammarParser,
	classification: textEngineClassificationGrammarParser
}


/**
 * Just a bulk caller to the guys who do the real job.
 */ 
export function parseTextEngineSequential<T extends TextEngineDataUnion>(
	code: string,
	modality: TextEngineModality
): GrammarParseResult<TextEngineSequentialInteractionData> {

	const chunks: string[] = splitByDoubleSemiColon(code);
	const parser: GrammarParser<T> = TEXT_ENGINE_PARSER_MAP[modality] as GrammarParser<T>;

	const data: TextEngineSequentialInteractionData = [];
	const errors: SimpleErrorObject[] = [];

	for (const chunk of chunks) {

		// We don't know what exact union member the parser will return here as to specify.
		// We are sure it is a union member and that it will be consistent, but not which one specifically.
		// The interaction to use this should infer the types of each member of the list as a check out.
		const result: GrammarParseResult<T> = parser(chunk);
		if (!result.ok) {
			if (result.errors) {
				if (Array.isArray(result.errors)) {
					errors.push(...result.errors);
				} else {
					errors.push(result.errors);
				}
			}
			continue;
		}

		// should we validate it beforehands? Or leave it to the interaction as we have been doing?
		data.push(result.data as TextEngineDataUnion);
	}

	if (errors.length > 0) return { ok: false, data: null, errors: errors }

	return {
		ok: true,
		data: data,
		errors: null
	}
}


