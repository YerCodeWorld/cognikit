import { BaseTableData } from "../types/Tables";

export type Variant = 'elegant' | 'playful' | 'outline' | 'letter' | 'sign' | 'minimal' | 'glass' | 'empty'; 

export type StimulusModality = 
	'image' 	| 
	'text' 		| 
	'audio' 	| 
	'video' 	| 
	'tts' 		| 
	'interactive'   | 
	'data'   	| 
	'anchor' 	| 
	'dynamic'	| 
	'composite';

export type ResponseModality = 
	'select' | 
	'write' | 
	'draw' | 
	'manipulate' | 
	'locate' | 
	'upload' | 
	'speak' | 
	'other' | 
	'none';

export type InteractionPresentationMode = 
	'normal' | 
	'mobile' | 
	'classrooms' |
	'study';

export type InteractionMechanic = 
	'single-slide' | 
	'sequential' | 
	'automatic-sequencing' | 
	'game';

// Refactor to CognitiveOp 
export type CognitiveProcess = 
	'discrimination' |
	'classification' |
	'freerecall' 	 |
	'production' 	 |
	'association' 	 |
	'comparisson' 	 |
	'transformation' |
	'seriation' 	 |
	'recognition' 	 |
	'cuedrecall' 	 |
	'evaluation';

type IInteractionSpec = any;

// refactor to InteractionBaseSpec
export type InteractionConfig = {
	construct: string;
	description: string;

	variant: Variant;  
	shuffle: boolean;

	stimulus?: StimulusModality;
	responseModality?: ResponseModality;
	presentationMode?: InteractionPresentationMode;

	playIntroAnimation?: boolean;
	animationsEnabled?: boolean;

	inLineFeedback?: boolean;

	attemptLimit: number | null;
	timer: number | null;
}

// ================== DATA STRUCTURES ===================
//
export type ItemData = 
	ClassificationData | 
	AssociationData	   |
	BaseTableData 	   |
	FreeRecallData;
export type ClassificationData = {
	type: 'classification'; 
	categories: { label: string; items: string[] }[];
	distractors?: string[];
}

export type AssociationData = {
	type: 'association';
	pairs: { left: string; right: string }[];
	distractors?: string[];
}

export type FreeRecallData = {
	type: 'freerecall';
	instructions: { prompt: string; words: string[] }[];
}

export type SeriationData = {
	type: 'seriation';
	items: string[];
}
//
// to be completed later when we get things straight 
export interface DiscriminationData {}
export interface ComparisonData {}
export interface CuedRecallData {}
export interface TransformationData {}
export interface RecognitionData {}
export interface EvaluationData {}

export interface Module {

	id: string;
	process: CognitiveProcess;

	implementation: {
		parser(code: string): ParsingResult;  
		validator(data: ItemData): ValidationResult;
		interactions: Record<string, any>;  // any: change for someClass later
	}

	help: string;
}

export interface IInteraction {
	id: string;
	name: string;
	data?: ItemData;
	css: string;
	examples: Record<string, string>; 
}

// -------------- get rid of this
export type ParsingResult = {
	ok: boolean;
	data?: ItemData | null; 
	errors?: Record<string, string> | null;
}

export type ValidationResult = {
	ok: boolean;
	errors: Record<string, string> | null; 
}

