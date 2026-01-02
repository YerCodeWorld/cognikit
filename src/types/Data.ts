import { BaseTableData } from "./Tables";

export type InteractionData = 
	ClassificationData |
	AssociationData    |
	BaseTableData	   |
	FreeRecallData 	   |
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

export type FreeRecallData = {
	type: 'freerecall';
	instructions: { prompt: string; words: string[] }[];
}

export type SeriationData = {
	type: 'seriation';
	items: string[];
}

// to be completed later when we get things straight 
export interface DiscriminationData {
	type: 'discrimination';
	data: { content: string; targets: { [pos: string]: string }[] };
}

export interface CuedRecallData {}

export interface RecognitionData {
	type: 'recognition';
	data: { question: string; correctOptions: string[]; options: string[] }[];
}

export interface ComparisonData {}
// export interface EvaluationData {}
// export interface TransformationData {}
