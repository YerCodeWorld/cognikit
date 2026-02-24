import { BaseInteraction } from "../../core/BaseInteraction";
import { Variant } from "../../shared/types";
import { InteractionConfig, InteractionMechanic } from "../../types/Interactions";
import { TableConfiguration, ValueTableData, TableCompletion } from "../../types/Tables";
import { EduTable, adjacencyTableGrader, detectCellKind, getAllValues, getAllUniqueValues, getAdjacencyCellGrading } from "../../engines/tables";

export class AdjacencyTable extends BaseInteraction<ValueTableData> {

	interactionMechanic: InteractionMechanic = "static";

	private _tableConfig: TableConfiguration;
	private _$table!: EduTable;

	constructor(data: ValueTableData, config: InteractionConfig) {
		super(data, config);

		const allValues = getAllValues(data.answerKey);
		const cellKind = detectCellKind(allValues);

		// Configure table for adjacency mode
		this._tableConfig = {
			rows: data.rows,
			cols: data.cols,
			answerKey: data.answerKey,
			cellKind,
			preset: 'adjacency',
			disabled: (r, c) => r === c, // Disable diagonal
			allowed: cellKind === 'select' ? () => getAllUniqueValues(data.answerKey) : undefined,
			variant: config.variant ?? 'outline',
			shuffle: config.shuffle ?? false
		};

		// Initialize progress tracking (total cells excluding diagonal)
		const totalCells = data.rows.length * (data.rows.length - 1);
		this.initializeProgress(totalCells);
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

		// Render with wrapper for proper height/overflow handling
		this.innerHTML = `
			<style>
				:host {
					display: flex;
					width: 100%;
					height: 100%;
					box-sizing: border-box;
				}

				.table-container {
					display: flex;
					flex-direction: column;
					width: 100%;
					height: 100%;
					overflow: hidden;
					box-sizing: border-box;
				}

				.table-wrapper {
					flex: 1;
					overflow-y: auto;
					overflow-x: auto;
					min-height: 0;
					padding: 1rem;
				}
			</style>
			<div class="table-container">
				<div class="table-wrapper"></div>
			</div>
		`;

		const wrapper = this.querySelector('.table-wrapper') as HTMLDivElement;
		wrapper.appendChild(this._$table);
	}

	// ==================== INTERACTION LOGIC ====================

	/**
	 * Update progress bar based on how many non-diagonal cells are filled
	 */
	private updateProgressBasedOnCompletion(): void {
		const state = this._$table.getState();
		let completedCells = 0;

		for (const row of this.data.rows) {
			for (const col of this.data.cols) {
				if (row === col) continue; // Skip diagonal

				const value = state[row]?.values[col];
				if (value !== null && value !== undefined && value !== '') {
					completedCells++;
				}
			}
		}

		this.setProgress(completedCells);
	}

	getCurrentState(): TableCompletion {
		return this._$table.getState();
	}

	isInteractionComplete(): boolean {
		const state = this._$table.getState();

		// All non-diagonal cells must have values
		for (const row of this.data.rows) {
			for (const col of this.data.cols) {
				if (row === col) continue; // Skip diagonal

				const value = state[row]?.values[col];
				if (value === null || value === undefined || value === '') {
					return false;
				}
			}
		}

		return true;
	}

	onHint(): void {
		const state = this._$table.getState();

		// Find first empty non-diagonal cell
		for (const row of this.data.rows) {
			for (const col of this.data.cols) {
				if (row === col) continue;

				const value = state[row]?.values[col];
				if (value === null || value === undefined || value === '') {
					alert(`Hint: You haven't filled the cell for "${row}" → "${col}" yet.`);
					this.emitHintShown(`Empty cell: ${row} → ${col}`);
					return;
				}
			}
		}

		alert('All cells are complete! Click "Check" to submit.');
		this.emitHintShown('All cells complete');
	}

	// ==================== GRADING ====================

	/**
	 * Override submit to include grading using adjacency grader
	 */
	public submit(): void {
		// Check completion first (will throw if not complete)
		super.submit();

		// Grade the response using adjacency grader
		const userData = this.getCurrentState();
		const result = adjacencyTableGrader(
			this.data.answerKey,
			userData,
			this.data.rows
		);

		// Generate per-cell grading feedback
		const cellGrading = getAdjacencyCellGrading(
			this.data.answerKey,
			userData,
			this.data.rows
		);

		// Apply grading state to table
		this._$table.setGradingState(cellGrading);

		console.log(`Adjacency Table Score: ${result.score.toFixed(1)}% (${result.correct}/${result.total} correct)`);

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
			this._$table.clearGradingState();
		}
	}
}

if (!customElements.get('adjacency-table')) {
	customElements.define('adjacency-table', AdjacencyTable);
}
