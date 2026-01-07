import { BaseInteraction } from "../../../core/BaseInteraction";
import { Variant } from "../../../shared/types";
import { InteractionConfig, InteractionMechanic } from "../../../types/Interactions";
import { NormalizedAssets } from "../../../shared/assets";
import { SeriationData } from "../../../types/Data";

import { EduChip, setUpChipData } from "../../../ui/misc/chip";
import { shuffle } from "../../../shared";
import { seriationGrader } from "../utilities/grader";

export class RankOrder extends BaseInteraction<SeriationData> {

	interactionMechanic: InteractionMechanic = "static";

	private currentOrder: string[] = [];
	private isGraded: boolean = false;

	private $container!: HTMLDivElement;
	private $rowsContainer!: HTMLDivElement;

	private draggedRowIndex: number | null = null;
	private dragOverRowIndex: number | null = null;

	private isDragging: boolean = false;
	private draggedRow: HTMLElement | null = null;
	private dragOffsetY: number = 0;
	private boundPointerMove: (e: PointerEvent) => void;
	private boundPointerUp: (e: PointerEvent) => void;

	private variant: Variant;

	constructor(
		data: SeriationData,
		config: InteractionConfig,
		assets: NormalizedAssets | null
	) {
		super(data, config, assets);

		if (this.config.shuffle) this.currentOrder = shuffle([...this.data.items]);
		else this.currentOrder = [...this.data.items];
		
		this.implementsProgress = false;
		this.variant = this.config.variant;
	}

	protected initialize(): void {
		this.boundPointerMove = this.handlePointerMove.bind(this);
		this.boundPointerUp = this.handlePointerUp.bind(this);
		window.addEventListener("pointermove", this.boundPointerMove);
		window.addEventListener("pointerup", this.boundPointerUp);
	}

	protected cleanup(): void {
		window.removeEventListener("pointermove", this.boundPointerMove);
		window.removeEventListener("pointerup", this.boundPointerUp);
	}

	onVariantChange(newVariant: Variant): void {
		this.querySelectorAll('edu-chip').forEach((el: EduChip) => {
			if (el.variant !== undefined) {
				el.variant = newVariant;
			}
		});
		this.variant = newVariant;
	}

	// ==================== RENDERING ====================

	render(): void {
		this.innerHTML = `
			<style>
				:host {
					display: flex;
					width: 100%;
					height: 100%;
					box-sizing: border-box;
				}

				.container {
					display: flex;
					flex-direction: column;
					width: 100%;
					height: 100%;
					gap: 1rem;
					padding: 1.5rem;
					box-sizing: border-box;
					overflow: hidden;
				}

				.label {
					font-size: 0.9rem;
					font-weight: 600;
					color: rgb(var(--edu-second-ink));
					flex-shrink: 0;
				}

				.rows-container {
					flex: 1;
					display: flex;
					flex-direction: column;
					align-items: left;
					gap: 0.5rem;
					overflow-y: auto;
					overflow-x: hidden;
					min-height: 0;
					padding: 0.5rem;
					padding-right: 40%;
				}

				.row {
					display: flex;
					align-items: center;
					background: transparent;
					border: none;
					transition: all 0.2s ease;
					cursor: grab;
					gap: 0.50rem;
				}

				.row:active {
					cursor: grabbing;
				}

				.row.drag-over {
					border-color: rgb(var(--edu-first-accent));
					background: rgba(var(--edu-first-accent), 0.1);
					transform: translateY(-2px);
				}

				.row.dragging {
					opacity: 0.5;
					transform: scale(0.98);
				}

				.chip-wrapper {
					flex: 1;
					min-width: 0;
				}

				edu-chip {
					width: 100%;
				}

				.controls {
					display: flex;
					flex-shrink: 0;
				}

				.btn {
					display: flex;
					align-items: center;
					justify-content: center;
					background: transparent;
					border: none;
					cursor: pointer;
					transition: all 0.2s ease;
				}

				.btn:hover:not(:disabled) {
					background: rgba(var(--edu-first-accent), 0.1);
					transform: translateY(-1px);
				}

				.btn:active:not(:disabled) {
					transform: scale(0.95);
				}

				.btn:disabled {
					opacity: 0.3;
					cursor: not-allowed;
				}

				.btn svg {
					width: 18px;
					height: 18px;
					fill: rgb(var(--edu-ink));
				}

				@media (max-width: 1024px) {
					.rank-number: { padding: 0 }
				}

				@media (max-width: 640px) {
					.container {
						padding: 1rem;
					}

					.rows-container { padding: 0 }

					.rank-number {
						width: 28px;
						height: 28px;
						font-size: 0.85rem;
					}

					.btn {
						width: 32px;
						height: 32px;
					}

					.btn svg {
						width: 16px;
						height: 16px;
					}
				}
			</style>

			<div class="container">
				<div class="rows-container"></div>
			</div>
		`;

		this.$container = this.querySelector('.container')!;
		this.$rowsContainer = this.querySelector('.rows-container')!;

		this.renderRows();
	}

	private renderRows(): void {
		this.$rowsContainer.innerHTML = '';

		this.currentOrder.forEach((item, index) => {
			const row = document.createElement('div');
			row.className = 'row';
			row.dataset.index = String(index);

			// Chip
			const chipWrapper = document.createElement('div');
			chipWrapper.className = 'chip-wrapper';

			const chip = document.createElement('edu-chip') as EduChip;
			chip.variant = this.variant;
			chip.dataset.item = item;
			chip.prefix = String(index+1);
			chip.draggable = true;
			setUpChipData(item, chip, this.assets?.assetsById);

			// Show correctness state if graded
			if (this.isGraded) {
				const correctIndex = this.data.items.indexOf(item);
				if (correctIndex === index) {
					chip.chipState = 'correct';
				} else {
					chip.chipState = 'wrong';
				}
			}

			chipWrapper.appendChild(chip);

			// Controls
			const controls = document.createElement('div');
			controls.className = 'controls';

			const upBtn = this.createButton('up', index);
			const downBtn = this.createButton('down', index);

			controls.appendChild(upBtn);
			controls.appendChild(downBtn);

			// Assemble row
			row.appendChild(chipWrapper);
			row.appendChild(controls);

			// Pointer event listener for drag
			if (!this.isGraded) {
				row.addEventListener('pointerdown', (e) => this.handlePointerDown(e, index));
			}

			this.$rowsContainer.appendChild(row);
		});
	}

	private createButton(direction: 'up' | 'down', index: number): HTMLButtonElement {
		const btn = document.createElement('button');
		btn.className = 'btn';
		btn.dataset.direction = direction;
		btn.dataset.index = String(index);

		// Disable buttons at boundaries
		if (direction === 'up' && index === 0) {
			btn.disabled = true;
		}
		if (direction === 'down' && index === this.currentOrder.length - 1) {
			btn.disabled = true;
		}

		// Disable all buttons if graded
		if (this.isGraded) {
			btn.disabled = true;
		}

		// SVG icons
		const svg = direction === 'up'
			? `<img src="assets/icons/up.svg" alt="^" height="24" width="24"/>`
			: `<img src="assets/icons/down.svg" alt="^" height="24" width="24"/>`;

		btn.innerHTML = svg;

		// Click handler
		btn.addEventListener('click', () => {
			if (direction === 'up' && index > 0) {
				this.swapItems(index, index - 1);
			} else if (direction === 'down' && index < this.currentOrder.length - 1) {
				this.swapItems(index, index + 1);
			}
		});

		return btn;
	}

	// ==================== SWAP LOGIC ====================

	private swapItems(index1: number, index2: number): void {
		const temp = this.currentOrder[index1];
		this.currentOrder[index1] = this.currentOrder[index2];
		this.currentOrder[index2] = temp;

		this.renderRows();
		this.emitStateChange();
	}

	// ==================== DRAG & DROP ====================

	private handlePointerDown(e: PointerEvent, index: number): void {
		// Don't drag on button clicks
		if ((e.target as HTMLElement).closest('.btn')) return;

		e.preventDefault();

		this.isDragging = true;
		this.draggedRow = e.currentTarget as HTMLElement;
		this.draggedRowIndex = index;

		const rect = this.draggedRow.getBoundingClientRect();
		this.dragOffsetY = e.clientY - rect.top;

		try {
			this.draggedRow.setPointerCapture(e.pointerId);
		} catch (err) {
			console.warn('Failed to capture pointer:', err);
		}

		this.draggedRow.classList.add('dragging');
	}

	private handlePointerMove(e: PointerEvent): void {
		if (!this.isDragging || !this.draggedRow) return;

		// Determine which row we're hovering over
		const hoverIndex = this.getRowIndexAtY(e.clientY);

		// Remove drag-over class from all rows
		this.$rowsContainer.querySelectorAll('.row').forEach(row => {
			row.classList.remove('drag-over');
		});

		if (hoverIndex !== -1 && hoverIndex !== this.draggedRowIndex) {
			// Add drag-over class to the hovered row
			const rows = Array.from(this.$rowsContainer.children) as HTMLElement[];
			if (rows[hoverIndex]) {
				rows[hoverIndex].classList.add('drag-over');
			}
		}
	}

	private handlePointerUp(e: PointerEvent): void {
		if (!this.isDragging || !this.draggedRow) return;

		try {
			this.draggedRow.releasePointerCapture(e.pointerId);
		} catch (err) {
			// Capture may not be active - that's okay
		}

		const hoverIndex = this.getRowIndexAtY(e.clientY);

		if (hoverIndex !== -1 && hoverIndex !== this.draggedRowIndex) {
			// Swap items
			this.swapItems(this.draggedRowIndex, hoverIndex);
		}

		// Clean up all drag states
		this.$rowsContainer.querySelectorAll('.row').forEach(row => {
			row.classList.remove('dragging', 'drag-over');
		});

		this.isDragging = false;
		this.draggedRow = null;
		this.draggedRowIndex = null;
		this.dragOverRowIndex = null;
	}

	private getRowIndexAtY(clientY: number): number {
		const rows = Array.from(this.$rowsContainer.children) as HTMLElement[];

		for (let i = 0; i < rows.length; i++) {
			const rect = rows[i].getBoundingClientRect();
			if (clientY >= rect.top && clientY <= rect.bottom) {
				return i;
			}
		}

		return -1;
	}

	// ==================== INTERACTION LOGIC ====================

	getCurrentState(): any {
		return {
			currentOrder: [...this.currentOrder],
			correctOrder: [...this.data.items]
		};
	}

	isInteractionComplete(): boolean {
		// Always complete (user can submit anytime)
		return true;
	}

	onHint(): void {
		// Count correctly positioned items
		let correctCount = 0;
		this.currentOrder.forEach((item, index) => {
			if (this.data.items[index] === item) {
				correctCount++;
			}
		});

		if (correctCount === this.currentOrder.length) {
			alert('All items are in the correct order! Click "Check" to submit.');
			this.emitHintShown('All items correctly ordered');
		} else {
			alert(`Hint: ${correctCount} out of ${this.currentOrder.length} items are in the correct position. Keep reordering!`);
			this.emitHintShown(`${correctCount}/${this.currentOrder.length} correct`);
		}
	}

	// ==================== GRADING ====================

	public submit(): void {
		super.submit();

		const result = seriationGrader(this.data.items, this.currentOrder, this);

		console.log(`Rank Order Score: ${result.score.toFixed(1)}% (${result.correct}/${result.total} correct)`);

		// Mark as graded and re-render to show correctness states
		this.isGraded = true;
		this.renderRows();

		this.dispatchEvent(new CustomEvent('interaction:graded', {
			detail: { result },
			bubbles: true,
			composed: true
		}));

		this.setAttribute('inert', '');
	}

	// ==================== RESET ====================

	public reset(): void {
		super.reset();

		// Re-shuffle order
		if (this.config.shuffle) {
			this.currentOrder = shuffle([...this.data.items]);
		} else {
			this.currentOrder = [...this.data.items];
		}

		this.isGraded = false;
		this.renderRows();
	}
}

// Register as custom element
if (!customElements.get('rank-order')) {
	customElements.define('rank-order', RankOrder);
}
