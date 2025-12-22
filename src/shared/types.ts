export type Variant = 'elegant' | 'playful' | 'outline' | 'letter' | 'sign' | 'minimal' | 'glass' | 'empty'; 
export type Stimulus = 'image' | 'text' | 'audio' | 'video' | 'html' | 'mixed';
export type InteractionResult = 'a' | 'b';

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

export type ItemData = 
	ClassificationData | 
	AssociationData	   |
	FreeRecallData;

export interface IInteractionInstance {
	readonly id: string;
	render(): void;
	isInteractionComplete(): boolean;  // important 
	getCurrentState(): any;
	destroy(): void;
}

export interface InteractionOptions<T extends ItemData = ItemData> {
	mount: HTMLElement;
	data: T;
	config: InteractionConfig;
	interactionHandler: (r: InteractionResult) => void;  // is this necessary considering the class arquitecture? 
}

export interface InteractionConfig {

	// all these are set up in the BaseInteraction class, they serve to configure the 'edu-window' shell component. 
	variant: Variant;  
	prompt: string;  
	headerEnabled: boolean;
	checkButtonEnabled: boolean;  // actually, this is useless 
	autoCheckButton: boolean;
	
	footerEnabled: boolean;
	footerAction: 'check' | 'navigation'; 
	
	stimulus: Stimulus; 

	counterEnabled: boolean;
	animationsEnabled: boolean;

	timer: number;
	retries: number;
	construct: string;  // specify what we are measuring (could be used as a label in the display)

	// interaction implementation level
	shuffle: boolean;
}

export interface ClassificationData {
	type: 'classification'; 
	categories: { label: string; items: string[] }[];
	distractors?: string[];
}

export interface AssociationData {
	type: 'association';
	pairs: { left: string; right: string }[];
	distractors?: string[];
}

export interface FreeRecallData {
	type: 'freerecall';
	instructions: { prompt: string; words: string[] }[];
}

// to be completed later when we get things straight 
export interface DiscriminationData {}
export interface ComparisonData {}
export interface CuedRecallData {}
export interface TransformationData {}
export interface SeriationData {}
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
	examples: Record<string, string>;  // how the 'code' is written 
}

export type ParsingResult = {
	ok: boolean;
	data?: ItemData | null; 
	errors?: Record<string, string> | null;
}

export type ValidationResult = {
	ok: boolean;
	errors: Record<string, string> | null; // return the errors in a more detailed way 
}

