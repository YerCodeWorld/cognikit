import { InputElementData } from "./Input";
import { Variant } from "../shared/types";
import { GradingState } from "./Grading";

export type TextEngineRenderMode = 'highlight' | 'dnd' | 'blanks' | 'transformation' | 'classification';
export type TextEngineModality = 'base' | 'blanks' | 'classification';
// the type above
export type TextEngineDataUnion =
	TextEngineBaseData           |
	TextEngineBlanksData 	     |
	TextEngineClassificationData;

// ========= TARGETS, since these are needed on their own ===========

// 'words' doesn't really make sence here, we mean 'word'
export type TextEngineBaseDataTarget = { words: string[]; startPos: number; endPos: number; };

// seems kinda stupid, but we are dealing with input elements. we need their id to fetch them and get their value, and then
// each element type has a unique data response object we need to compare against, since looking for words is the same as 
// looking for a data, ranges of numbers or a list of options
export type TextEngineBlanksDataTarget = { id: string; expectedValue: InputElementData; };

// easy money, no need to repeat the pattern for each individual pattern, since TextEngineBaseDataTarget is that same thing.
// The classification modality itself is just a layer of complexity above that base type
export type TextEngineClassificationDataTarget = { category: string; targets: TextEngineBaseDataTarget[]; };

// BASE DATA INTERFACE, WHICH WILL BE EXTENDED BY EACH MODALITY
interface TextEngineData {
	type: TextEngineModality;
	parts: string[]; // global; means each word of the string for end-use in the interactions
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
	distractors?: string[]; // this is only used in the DND rendering mode 
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

// NOTE: each member of the list is not a different type, how can you specify this here?
export type TextEngineSequentialInteractionData = TextEngineDataUnion[];

// ==================== TEXT ENGINE CONFIGURATION ====================

/**
 * Rendering mode for text engine
 * - highlight: Click words to select/highlight
 * - dnd: Drag and drop words/chips
 * - blanks: Fill in input elements
 * - transformation: Edit text in contenteditable areas
 * - classification: Assign words to categories
 */

/**
 * Grading state for parts (word indices) or inputs (IDs)
 */
export type TextEngineGradingState = Record<number | string, GradingState>;

/**
 * Configuration for the EduText custom element
 */
export interface TextEngineConfiguration {
	data: TextEngineDataUnion;
	mode: TextEngineRenderMode;
	variant?: Variant;
	gradingState?: TextEngineGradingState;
	categories?: string[];
}

/**
 * Change event detail for EduText element
 */
export interface EduTextChangeDetail {
	/** Current user data state */
	userState: any;

	/** Type of data (base/blanks/classification) */
	dataType: TextEngineModality;
}

/**
 * State tracking for EduText element
 */
export interface TextEngineState {
	/** For highlight: selected word indices */
	selectedIndices?: Set<number>;

	/** For DND: target index -> placed word */
	dndPlacements?: Record<number, string>;

	/** For blanks: input values by ID */
	inputValues?: Record<string, any>;

	/** For classification: word index -> category name */
	wordCategories?: Record<number, string>;

	/** For transformation: target index -> transformed words */
	transformations?: Record<number, string[]>;
}
