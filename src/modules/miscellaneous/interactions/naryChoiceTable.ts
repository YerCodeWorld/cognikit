import { BaseInteraction } from "../../../core/BaseInteraction";
import { Variant } from "../../../shared/types";
import { InteractionConfig, InteractionMechanic } from "../../../types/Interactions";
import { TableConfiguration, BaseTableData, TableCompletion } from "../../../types/Tables";
import { EduTable, naryTableGrader } from "../../../engines/tables";

export class NaryChoiceTable extends BaseInteraction<BaseTableData> {

	interactionMechanic: InteractionMechanic = "static";

	private _tableConfig: TableConfiguration;
	private _$table!: EduTable;

	constructor(data: BaseTableData, config: InteractionConfig) {
		super(data, config);

		// Configure table for n-ary mode (radio buttons)
		this._tableConfig = {
			rows: data.rows,
			cols: data.cols,
			answerKey: data.answerKey,
			cellKind: 'radio',
			preset: 'n-ary',
			variant: config.variant ?? 'outline',
			shuffle: true 
		};

		// Initialize progress tracking (one per row)
		this.initializeProgress(data.rows.length);
	}

	// ==================== LIFECYCLE ====================

	protected initialize(): void {}
	protected cleanup(): void {}

	onVariantChange(newVariant: Variant): void {
		this._tableConfig.variant = newVariant;
		if (this._$table) {
			this._$table.setAttribute('variant', newVariant);
		}
	}

	// ==================== RENDERING ====================

	render(): void {
		// Update table config variant to match current
		this._tableConfig.variant = this.config.variant;

		// Create table
		this._$table = document.createElement('edu-table') as EduTable;
		this._$table.config = this._tableConfig;

		// Listen to table changes
		this._$table.addEventListener('change', () => {
			this.updateProgressBasedOnCompletion();
			this.emitStateChange();
		});

		// Render directly to this element
		this.innerHTML = '';
		this.appendChild(this._$table);
	}

	// ==================== INTERACTION LOGIC ====================

	/**
	 * Update progress bar based on how many rows have exactly one selection
	 * N-ary requires single selection per row
	 */
	private updateProgressBasedOnCompletion(): void {
		const state = this._$table.getState();
		let completedRows = 0;

		for (const row of this.data.rows) {
			// N-ary requires exactly 1 selection per row
			if (state[row]?.selectedCols.length === 1) {
				completedRows++;
			}
		}

		this.setProgress(completedRows);
	}

	getCurrentState(): TableCompletion {
		return this._$table.getState();
	}

	isInteractionComplete(): boolean {
		const state = this._$table.getState();

		// All rows must have exactly one selection (n-ary constraint)
		return this.data.rows.every(row =>
			state[row]?.selectedCols.length === 1
		);
	}

	onHint(): void {
		const state = this._$table.getState();
		const incompleteRows = this.data.rows.filter(row =>
			!state[row] || state[row].selectedCols.length !== 1
		);

		if (incompleteRows.length === 0) {
			alert('All rows are complete! Click "Check" to submit.');
			this.emitHintShown('All rows complete');
			return;
		}

		// Show hint for first incomplete row
		const firstIncomplete = incompleteRows[0];
		alert(`Hint: You haven't selected a category for "${firstIncomplete}" yet. Which one does it belong to?`);
		this.emitHintShown(`Incomplete row: ${firstIncomplete}`);
	}

	// ==================== GRADING ====================

	/**
	 * Override submit to include grading using n-ary grader
	 * N-ary grading is binary per row (100% or 0%)
	 */
	public submit(): void {
		// Check completion first (will throw if not complete)
		super.submit();

		// Grade the response using n-ary grader
		const userData = this.getCurrentState();
		const result = naryTableGrader(
			this.data.answerKey,
			userData,
			this.data.rows
		);

		console.log(`N-ary Choice Score: ${result.score.toFixed(1)}% (${result.correct}/${result.total} correct)`);

		// Emit grading event
		this.dispatchEvent(new CustomEvent('interaction:graded', {
			detail: { result },
			bubbles: true,
			composed: true
		}));
	}

	// ==================== RESET ====================

	public reset(): void {
		super.reset();
		if (this._$table) {
			this._$table.reset();
		}
	}
}

if (!customElements.get('nary-choice-table')) {
	customElements.define('nary-choice-table', NaryChoiceTable);
}
