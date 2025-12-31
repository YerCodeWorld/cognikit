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
	'click' | 
	'write' | 
	'draw' | 
	'manipulate' | 
	'upload' | 
	'other';  

export type InteractionPresentationMode = 
	'normal' | 
	'mobile' | 
	'classrooms'; 

export type InteractionDisplayMode = 
	'linear' |
	'paginating' |
	'sequential' |
	'automatic-sequencing' |
	'game'; 

export type CognitiveOp = 
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
	content: string;

	variant: Variant;  
	shuffle: boolean;

	stimulus?: StimulusModality;
	responseModality?: ResponseModality;
	displayMode?: InteractionPresentationMode;
	animationsEnabled?: boolean;
	
	immediateChecking?: boolean;
	studyMode?: boolean;
	inLineFeeback?: boolean;

	attemptLimit: number | null;
	timer: number | null;
}

// ================== DATA STRUCTURES ===================

export type ItemData = 
	ClassificationData | 
	AssociationData	   |
	BaseTableData;

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

export interface Module {

	id: string;
	process: CognitiveOp;

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

