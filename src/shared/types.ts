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
	Extract<StimulusModality, 'image' | 'text' | 'audio' | 'video' | 'tts'> | 
	'html'; 

export type ResponseModality = 
	'select' | 
	'write' | 
	'draw' | 
	'manipulate' | 
	'locate' | 
	'upload' | 
	'other' | 
	'none';

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

export interface Module {

	id: string;
	process: CognitiveOp;
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

