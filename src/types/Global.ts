import { InteractionData } from "./Data";
import { InputElementData } from "./Input";

export type StyleVariant = 'elegant' | 'playful' | 'outline' | 'letter' | 'sign' | 'minimal' | 'card' | 'glass' | 'empty'; 

export type CognitiveOperation = 
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

// -------------- get rid of this
// or move it somehwere else
export type ParsingResult = {
	ok: boolean;
	data?: InteractionData | null; 
	errors?: Record<string, string> | null;
}

export type ValidationResult = {
	ok: boolean;
	errors: Record<string, string> | null; 
}

type DataTypesUnion = InteractionData | InputElementData;

export type GrammarParseResult<T extends DataTypesUnion = DataTypesUnion> = {
	ok: boolean;
	data?: T | null;
	errors?: SimpleErrorObject | SimpleErrorObject[] | null;
}

export type SimpleErrorObject = Record<string, string>;
export type ComplexErrorObject = SimpleErrorObject[];

export type GrammarParser<T extends DataTypesUnion = DataTypesUnion> = (code: string) => GrammarParseResult<T>;
export type Validator = (data: InteractionData) => ValidationResult;
// export type grader ...

