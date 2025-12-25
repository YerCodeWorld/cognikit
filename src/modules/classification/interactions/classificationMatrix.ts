import { BaseInteraction } from "../../../core";
import { InteractionOptions } from "../../../shared";
import { TableConfiguration, BaseTableData, TableCompletion } from "../../../types/Tables";
import { EduTable, classificationTableGrader } from "../../../engines/tables";

/**
 * Classification Matrix Interaction
 *
 * Presents a table where users can assign multiple attributes (columns) to items (rows)
 * using checkboxes. Each item can belong to multiple categories.
 *
 * Example use case: "Which programming languages have these features?"
 * - Rows: Python, Java, Rust, JavaScript
 * - Columns: Interpreted, Strongly Typed, Supports OOP
 */
export class ClassificationMatrix extends BaseInteraction<BaseTableData> {

	private _tableConfig: TableConfiguration;
	private _$table!: EduTable;

	constructor(options: InteractionOptions<BaseTableData>) {
		super(options);

		// Configure table for classification mode
		this._tableConfig = {
			rows: this.data.rows,
			cols: this.data.cols,
			answerKey: this.data.answerKey,
			cellKind: 'checkbox',
			preset: 'classification',
			variant: this.config.variant ?? 'outline'
		};

		// Track progress per row (each row needs at least one selection)
		this.initializeProgress(this.data.rows.length);
	}

	render(): void {
		const content = this.getContentArea();

		// Create and configure table
		this._$table = document.createElement('edu-table') as EduTable;
		this._$table.config = this._tableConfig;

		// Listen to table changes for progress tracking
		this._$table.addEventListener('change', () => {
			this.updateProgressBasedOnCompletion();
		});

		content.innerHTML = '';
		content.append(this._$table);
	}

	/**
	 * Update progress bar based on how many rows have at least one selection
	 */
	private updateProgressBasedOnCompletion(): void {
		const state = this._$table.getState();
		let completedRows = 0;

		for (const row of this.data.rows) {
			if (state[row]?.selectedCols.length > 0) {
				completedRows++;
			}
		}

		this.updateProgress(completedRows);
	}

	getCurrentState(): TableCompletion {
		return this._$table.getState();
	}

	isInteractionComplete(): boolean {
		const state = this._$table.getState();

		// All rows must have at least one selection
		return this.data.rows.every(row =>
			state[row]?.selectedCols.length > 0
		);
	}

	protected submitForScoring(): void {
		const userData = this._$table.getState();

		// Grade using classification grader (allows partial credit)
		const result = classificationTableGrader(
			this.data.answerKey,
			userData,
			this.data.rows,
			this.data.cols
		);

		console.log(`Classification Score: ${result.score.toFixed(1)}% (${result.correct}/${result.total} correct)`);

		// Disable interaction after submission
		this.disableCheckButton();
		this.shell.setAttribute("inert", "");

		// Call parent to trigger interactionHandler
		super.submitForScoring();
	}
}
