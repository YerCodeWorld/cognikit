import { BaseInteraction } from "../../../core/BaseInteraction";
import { InteractionConfig } from "../../../shared";
import { TableConfiguration, BaseTableData, TableCompletion } from "../../../types/Tables";
import { EduTable, classificationTableGrader } from "../../../engines/tables";

/**
 * ClassificationMatrixV2 - Shell-Agnostic Classification Interaction
 *
 * Table-based interaction using checkboxes to assign multiple attributes
 * to items. Built on V2 architecture - works with or without shell.
 *
 * @example
 * ```typescript
 * // With shell
 * const interaction = new ClassificationMatrixV2(data, config);
 * shell.setInteraction(interaction);
 *
 * // Without shell
 * const interaction = new ClassificationMatrixV2(data, config);
 * document.getElementById('app').appendChild(interaction);
 * ```
 */
export class ClassificationMatrix extends BaseInteraction<BaseTableData> {

	private _tableConfig: TableConfiguration;
	private _$table!: EduTable;

	constructor(data: BaseTableData, config: InteractionConfig) {
		super(data, config);

		// Configure table for classification mode
		this._tableConfig = {
			rows: data.rows,
			cols: data.cols,
			answerKey: data.answerKey,
			cellKind: 'checkbox',
			preset: 'classification',
			variant: config.variant ?? 'outline'
		};

		// Initialize progress tracking (one per row)
		this.initializeProgress(data.rows.length);
	}

	// ==================== LIFECYCLE ====================

	protected initialize(): void {
		// Set up any initial state if needed
	}

	protected cleanup(): void {
		// Clean up event listeners if needed
	}

	protected onVariantChange(newVariant: string): void {
		// Update table variant when shell changes it
		this._tableConfig.variant = newVariant as any;
		if (this._$table) {
			this._$table.config = this._tableConfig;
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

		this.setProgress(completedRows);
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

	onHint(): void {
		const state = this._$table.getState();
		const emptyRows = this.data.rows.filter(row =>
			!state[row] || state[row].selectedCols.length === 0
		);

		if (emptyRows.length === 0) {
			alert('All rows are complete! Click "Check" to submit.');
			this.emitHintShown('All rows complete');
			return;
		}

		// Show hint for first incomplete row
		const firstEmpty = emptyRows[0];
		alert(`Hint: You haven't classified "${firstEmpty}" yet. Which categories does it belong to?`);
		this.emitHintShown(`Incomplete row: ${firstEmpty}`);
	}

	// ==================== GRADING ====================

	/**
	 * Override submit to include grading
	 */
	public submit(): void {
		// Check completion first (will throw if not complete)
		super.submit();

		// Grade the response
		const userData = this.getCurrentState();
		const result = classificationTableGrader(
			this.data.answerKey,
			userData,
			this.data.rows,
			this.data.cols
		);

		console.log(`Classification Score: ${result.score.toFixed(1)}% (${result.correct}/${result.total} correct)`);

		// Could emit a grading event here if needed
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

// Register as custom element
if (!customElements.get('classification-matrix')) {
	customElements.define('classification-matrix', ClassificationMatrix);
}
