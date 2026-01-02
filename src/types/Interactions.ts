import { StimulusModality, Variant, ResponseModality } from "../shared/types";
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

export type IInteractionSpec = any;

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

export type IInteraction = {
	id: string;
	name: string;
	data?: InteractionData;
	css: string;
	examples: Record<string, string>; 
}


