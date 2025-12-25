import { Variant } from "../shared";

// Used by parsers
export type BaseTableData = { rows: string[]; cols: string[]; answerKey: Map<string, string[]>; }

export type CellValue = string | number | boolean | null;
export type CellKind = 'text' | 'number' | 'select' | 'radio' | 'checkbox';

export type TableState = Record<string, Record<string, CellValue>>;

export interface TableConfiguration {
	cols: string[];
	rows: string[];
	answerKey: Map<string, string[]>;

	cellKind?: CellKind;
	// custom tables with custom disabled cells (adjacency disables a the middle diagonla by default) 
	disabled?: (r: string, c: string) => boolean;

	// For usage on select/constraint entries 
	allowed?: (r: string, c: string) => CellValue[] | null;

	preset?: 'lookup' | 'n-ary' | 'classification' | 'adjacency';
	variant?: Variant;
}

export type RowValues = {
	selectedCols: string[];            // derived for checkbox/radio
	values: Record<string, CellValue>; // always present (raw)
};

export type TableCompletion = Record<string, RowValues>;

export type EduTableChangeDetail = {
	row: string;
	col: string;
	value: CellValue;
	state: TableState;
	selection: TableCompletion;
};
