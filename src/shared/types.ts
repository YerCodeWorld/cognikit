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

export type ResponseObjectModality = 
	Extract<StimulusModality, 'image' | 'text' | 'audio' | 'video' | 'tts' | 'anchor'> | 
	'complex'; 

export type ResponseModality = 
	'select' | 
	'write' | 
	'draw' | 
	'manipulate' | 
	'locate' | 
	'upload' | 
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
	data: string;

	variant: Variant;  
	shuffle: boolean;

	stimulus?: StimulusModality;
	responseModality?: ResponseModality;
	presentationMode?: InteractionPresentationMode;

	playStaggeringAnimation?: boolean;
	animationsEnabled?: boolean;
	soundEnabled?: boolean;

	inLineFeedback?: boolean;
	immediateCheck?: boolean;

	attemptLimit: number | null;
	timer: number | null;
}

// ================== DATA STRUCTURES ===================
//
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

