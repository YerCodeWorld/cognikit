import { StimulusModality, Variant, ResponseModality, ResponseObjectModality } from "../shared/types";
import { InteractionData } from "./Data";

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

export type IInteractionSpec = unknown;
export type PromptDataModality = ResponseObjectModality;

// refactor to InteractionBaseSpec
export type InteractionConfig = {
	prompt: string;
	promptModality?: PromptDataModality; 
	promptData?: string;
	promptDataSpec?: string;

	variant: Variant;  
	shuffle: boolean;

	stimulus?: StimulusModality;
	construct?: string; // specify what we are measuring (could be used as a label in the display)

	responseModality?: ResponseModality;
	presentationMode?: InteractionPresentationMode;

	playStaggeringAnimation?: boolean;
	animationsEnabled?: boolean;
	soundEnabled?: boolean;

	inLineFeedback?: boolean;
	immediateFeedback?: boolean;

	attemptLimit: number | null;
	timer: number | null;
}

export type IInteraction = {
	id: string;
	name: string;
	data?: InteractionData;
	css: string;
	examples: Record<string, string>; 
}


