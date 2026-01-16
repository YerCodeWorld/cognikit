import { BaseTableData, ValueTableData } from "./Tables";
import { TextEngineBaseData, TextEngineBlanksData, TextEngineClassificationData, TextEngineSequentialInteractionData } from "./Text";

export type InteractionData = 
	ClassificationData 			|
	AssociationData    			|
	BaseTableData	   			|
	ValueTableData	   			|
	TextEngineBaseData           		|
	TextEngineBlanksData 	     		|
	TextEngineClassificationData 		|
	TextEngineSequentialInteractionData 	|
	FreeRecallData 	   			|
	RecognitionData	   			|
	SeriationData;

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

export type SeriationData = {
	type: 'seriation';
	items: string[];
}

// Alias for list recall - same structure as seriation (list of items)
export type FreeRecallData = SeriationData;

export interface RecognitionData {
	type: 'recognition';
	data: { question: string; correctOptions: string[]; options: string[] }[];
}

export interface ComparisonData {}
// export interface EvaluationData {}
// export interface TransformationData {}
