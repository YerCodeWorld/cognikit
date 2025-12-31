export type InteractionData = 
	FreeRecallData |
	SeriationData;

export type FreeRecallData = {
	type: 'freerecall';
	instructions: { prompt: string; words: string[] }[];
}

export type SeriationData = {
	type: 'seriation';
	items: string[];
}


// to be completed later when we get things straight 
export interface DiscriminationData {}
export interface ComparisonData {}
export interface CuedRecallData {}
export interface TransformationData {}
export interface RecognitionData {}
export interface EvaluationData {}

