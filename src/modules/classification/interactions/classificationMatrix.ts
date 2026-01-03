import { BaseInteraction } from "../../../core/BaseInteraction";
import { Variant } from "../../../shared/types";
import { InteractionConfig, InteractionMechanic } from "../../../types/Interactions";
import { TableConfiguration, BaseTableData, TableCompletion } from "../../../types/Tables";
import { EduTable, classificationTableGrader } from "../../../engines/tables";

/**
 * ClassificationMatrix
 *
 * Table-based interaction using checkboxes to assign multiple attributes
 * to items.
 * 
 * Inspired from Typeform's matrix and based on my table's engine
 * See their implementation in their content features:
 * @see https://admin.typeform.com
 * 
 */
export class ClassificationMatrix extends BaseInteraction<BaseTableData> {

	interactionMechanic: InteractionMechanic = "static";

	private _tableConfig: TableConfiguration;
	private _$table!: EduTable;

	constructor(data: BaseTableData, config: InteractionConfig) {

		super(data, config);

		this._tableConfig = {
			rows: data.rows,
			cols: data.cols,
			answerKey: data.answerKey,
			cellKind: 'checkbox',
			preset: 'classification',
			variant: config.variant ?? 'outline',
			shuffle: config.shuffle  
		};

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
		this._tableConfig.variant = this.config.variant;

		this._$table = document.createElement('edu-table') as EduTable;
		this._$table.config = this._tableConfig;

		this._$table.addEventListener('change', () => {
			this.updateProgressBasedOnCompletion();
			this.emitStateChange();
		});

		this.innerHTML = '';
		this.appendChild(this._$table);
	}

	// ==================== INTERACTION LOGIC ====================

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
	public submit(): void {
		super.submit();

		const userData = this.getCurrentState();
		const result = classificationTableGrader(
			this.data.answerKey,
			userData,
			this.data.rows,
			this.data.cols
		);

		console.log(`Classification Score: ${result.score.toFixed(1)}% (${result.correct}/${result.total} correct)`);

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

if (!customElements.get('classification-matrix')) {
	customElements.define('classification-matrix', ClassificationMatrix);
}
