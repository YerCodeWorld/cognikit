import { Variant, Stimulus } from "../shared";

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

export interface ItemData = 
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

export interface InteractionOptions {
	mount: HTMLElement;
	data: ItemData;
	item: any;  // the specific interaction to use 
	config: InteractionConfig;
	interactionHandler: (r: InteractionResult) => void;  // is this necessary considering the class arquitecture? 
}

export interface InteractionConfig {
	stimulus: Stimulus; 
	variant: Variant;  
	prompt: string;  
	shuffle: boolean;
	soundEnabled: boolean;
	animationsEnabled: boolean;
	instructionsEnabled: boolean;
	checkButtonEnabled: boolean;
	counterEnabled: boolean;
	navigationEnabled: boolean;
	timer: number;
	retries: number;
	construct: string;  // specify what we are measuring (could be used as a label in the display)
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
	item: string;

	implementation: {
		parser(code: string): ItemData; // this is a unique function in each module 
		validator(data: ItemData): ValidationResult;
		interactions: Record<string, IInteraction>; 
	}

	help: string;
}

export interface IInteraction {
	id: string;
	name: string;
	data: ItemData;
	css: string;
	examples: Record<string, string>;  // how the 'code' is written 
}

export type ValidationResult = {
	ok: boolean;
	errors: Record<string, string>; // return the errors in a more detailed way 
}

