import { Variant } from "../shared/types";
import { InteractionData } from "./Data";
import { AssetType } from "./Assets";

export type InteractionMechanic =
	'static' 		      |
	'sequential' 		      | 
	'automatic-sequencing' 	      | 
	'prefers-horizontal-overflow' |
	'prefers-vertical-overflow'   |
	'implements-open-canvas'      |
	'game';

export type IInteractionSpec = unknown;

// refactor to InteractionBaseSpec
export type InteractionConfig = {
	prompt: string;
	promptModality?: AssetType; 
	promptData?: string;
	promptDataSpec?: string;

	variant: Variant;  
	shuffle: boolean;

	construct?: string; // specify what we are measuring (could be used as a label in the display)

	playStaggeringAnimation?: boolean;
	animationsEnabled?: boolean;
	soundEnabled?: boolean;

	inLineFeedback?: boolean;
	immediateFeedback?: boolean;

	attemptLimit: number | null;
	timer: number | null;
}

// TODO: what is the identity for the interactions going to be from now on?
export type IInteraction = {
	id: string;
	name: string;
	data?: InteractionData;
	css: string;
	examples: Record<string, string>; 
}


