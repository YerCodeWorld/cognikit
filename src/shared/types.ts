import { InteractionData } from "../types/Data";

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
	'static' 		      |
	'sequential' 		      | 
	'automatic-sequencing' 	      | 
	'prefers-horizontal-overflow' |
	'prefers-vertical-overflow'   |
	'implements-open-canvas'      |
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

export interface IInteraction {
	id: string;
	name: string;
	data?: InteractionData;
	css: string;
	examples: Record<string, string>; 
}

export interface Module {

	id: string;
	process: CognitiveProcess;

	implementation: {
		parser(code: string): ParsingResult;  
		validator(data: InteractionData): ValidationResult;
		interactions: Record<string, any>;  // any: change for someClass later
	}

	help: string;
}


// -------------- get rid of this
export type ParsingResult = {
	ok: boolean;
	data?: InteractionData | null; 
	errors?: Record<string, string> | null;
}

export type ValidationResult = {
	ok: boolean;
	errors: Record<string, string> | null; 
}

