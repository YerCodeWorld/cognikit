import { InputElementData } from "./Input";

export type TextEngineModality = 'base' | 'blanks' | 'classification'; 

export type TextEngineDataUnion = 
	TextEngineBaseData           |
	TextEngineBlanksData 	     |
	TextEngineClassificationData;

export type TextEngineBaseDataTarget = { words: string[]; startPos: number; endPos: number; };
export type TextEngineBlanksDataTarget = { id: string; expectedValue: InputElementData; };
export type TextEngineClassificationDataTarget = { category: string; targets: TextEngineBaseDataTarget[]; };

interface TextEngineData {
	type: TextEngineModality;
	parts: string[];
	targets: TextEngineBaseDataTarget[] | TextEngineBlanksDataTarget[] | TextEngineClassificationDataTarget[];
}

// NOTE: The examples above each interface use the indexes of the 'words', but in real usage one would store
// the starting character index and the last character index.

/**
 * Words for HIGHLIGHT, DND Blanks and Transformation
 *
 * Example:
 *
 * The family will always [think] there's someone [destroying] their plans.
 *
 * { words: ["think"], startPos: 4, endPos: 4 },
 * { words: ["destroying"], startPost: 7, endPos: 7 }
 *
 * if distractors, they are defined like "= [... | ...];"
 *
 */
export interface TextEngineBaseData extends TextEngineData {
	type: 'base';
	targets: TextEngineBaseDataTarget[];
	distractors?: string[]; // although this is only used in the DND interaction 
}

/**
 * Fill Blanks Only - variations with [text, number, data, time, select, ..., mixed] input elements
 *
 * Example:
 *
 * I @tx(am) someone who doesn't like people who @tx(is) arrogant. I have told you that @nm(3) times already.
 *
 * { id: "generatedIdInParser', expectedValue: { value: ["am"] } },
 * { id: "...". expectedValue: { value: ["is"] } },
 * ... 
 *
 * The elements will be a generated string. That is, the parser would take '@tx(...)', and create '<edu-input as="text" id="...'>...'.
 * Then it would add the id (possibly using the hash helper function) and store the expectedValue object which would be the result of 
 * the parseText(code: string) helper function, passing the content taken from '@tx(...)' as a parameter.
 *
 */ 
export interface TextEngineBlanksData extends TextEngineData {
	type: 'blanks';
	targets: TextEngineBlanksDataTarget[]; 
}

/**
 * Classification Only -- extension of base highlight variation
 * Example:
 *
 * I am @cat(adjectives, tired) of @cat(verbs, seeing) everybody @cat(verbs, dance) @cat(adverbs, happily) while
 * we are here all @cat(adjectives, sad)!
 *
 * { category: adjectives; targets: [ { words: ["tired"], startPos: 2, endPos: 2 }, { words: ["sad"], startPos: 13, endPos: 13 }] },
 * ...
 *
 */
export interface TextEngineClassificationData extends TextEngineData {
	type: 'classification';
	targets: TextEngineClassificationDataTarget[]; 
}

export type TextEngineSequentialInteractionData = TextEngineDataUnion[];
