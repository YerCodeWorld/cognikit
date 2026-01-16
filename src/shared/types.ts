import { InteractionData } from "../types/Data";

export type Variant = 'elegant' | 'playful' | 'outline' | 'letter' | 'sign' | 'minimal' | 'glass' | 'empty'; 

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

export type GrammarParser = (code: string) => GrammarParseResult;
export type GrammarParseResult = ParsingResult;

export type SimpleErrorObject = Record<string, string>;
