export type InputModality = 'text' | 'number' | 'select' | 'date' | 'time';

export type InputElementReference = 'tx' | 'nm' | 'sl' | 'dt' | 'tm';
export type MediaRenference = 'im' | 'au' | 'tt' | 'vi' | 'ht';

export type InputElementData = 
	TextData	|
	NumberData	|
	SelectData	|
	DateData	|
	TimeData;

interface InputElementBaseData {
	type: InputModality;
	id: string;
	html: string;
}

export interface TextData extends InputElementBaseData {
	type: 'text';
	value: string[];
}

export interface NumberData extends InputElementBaseData {
	type: 'number';
	targets: number[];
	ranges?: { from: number; to: number; }[]; // results fo n..n patterns in the code
}

export interface SelectData extends InputElementBaseData {
	type: 'select';
	correctOptions: string[];
	options: string[];
}

// need to enforce these better 
// maybe use something like the looksLikeData() helper function?
export interface DateData extends InputElementBaseData { 
	type: 'date';
	value: string;
}

// same here
export interface TimeData extends InputElementBaseData {
	type: 'time';
	value: string;
}

// NOTE: consider that we would add more custom input elements here in the future
