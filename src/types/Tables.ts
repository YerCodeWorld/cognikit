import { Variant } from "../shared";
import { GradingState } from "./Grading";

export type BaseTableData = { rows: string[]; cols: string[]; answerKey: Map<string, string[]>; }
export type ValueTableData = { rows: string[]; cols: string[]; answerKey: TableState; }

export type CellValue = string | number | boolean | null;
export type CellKind = 'text' | 'number' | 'select' | 'radio' | 'checkbox';

export type TableState = Record<string, Record<string, CellValue>>;

export type CellGradingState = Record<string, Record<string, GradingState>>;

export interface TableConfiguration {
	cols: string[];
	rows: string[];
	answerKey: Map<string, string[]> | TableState;

	cellKind?: CellKind;
	// custom tables with custom disabled cells (adjacency disables a the middle diagonla by default)
	disabled?: (r: string, c: string) => boolean;

	// For usage on select/constraint entries
	allowed?: (r: string, c: string) => CellValue[] | null;

	preset?: 'lookup' | 'n-ary' | 'classification' | 'adjacency';
	variant?: Variant;

	shuffle?: boolean;

	// Grading feedback: per-cell states (correct/wrong/missed)
	gradingState?: CellGradingState;
}

export type RowValues = {
	selectedCols: string[];            // derived for checkbox/radio
	values: Record<string, CellValue>; 
};

export type TableCompletion = Record<string, RowValues>;

export type EduTableChangeDetail = {
	row: string;
	col: string;
	value: CellValue;
	state: TableState;
	selection: TableCompletion;
};
