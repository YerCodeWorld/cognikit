import { BaseInteraction } from "../../../core/BaseInteraction";
import { Variant } from "../../../shared/types";
import { InteractionConfig, InteractionMechanic } from "../../../types/Interactions";
import { NormalizedAssets } from "../../../shared/assets";
import { SeriationData } from "../../../types/Data";

import { EduChipScalable, setUpChipDataScalable } from "../../../ui/misc/chip-scalable/chip";
import { shuffle } from "../../../shared";
import { seriationGrader } from "../utilities/grader";

/**
 * RankOrderScalable - A scalable version of RankOrder
 *
 * Features based on UI.md:
 * - Container-driven scaling (uses container queries)
 * - Auto-reflow grid (single column → multi-column based on aspect ratio)
 * - Letterboxing for extreme Y (vertical centering)
 * - Max-width capping for extreme X (prevents infinite stretch)
 * - 10 item limit (Cognitive Ceiling)
 * - 44px minimum per row (Interaction Floor)
 * - Aspect-ratio aware layout transitions
 */
export class RankOrderScalable extends BaseInteraction<SeriationData> {

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

	// Scalability constants
	private readonly MAX_ITEMS = 10; // Cognitive Ceiling
	private readonly MIN_ITEM_HEIGHT = 44; // Interaction Floor (px)

	constructor(
		data: SeriationData,
		config: InteractionConfig,
		assets: NormalizedAssets | null
	) {
		super(data, config, assets);

		// Parent class now handles undefined data gracefully
		if (!this.isValid || !this.data || !this.config) return;

		const items = this.data.items;
		this.data.items = items;

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
		this.querySelectorAll('edu-chip-scalable').forEach((el: EduChipScalable) => {
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
				rank-order-scalable {
					display: flex;
					width: 100%;
					height: 100%;
					box-sizing: border-box;

					/* Enable container queries for aspect-ratio detection */
					container-type: size;
					container-name: rank-order;
				}

				.container {
					display: flex;
					flex-direction: column;
					width: 100%;
					height: 100%;
					padding: 0;
					box-sizing: border-box;
					overflow: hidden;

					/* Height Guardrail - prevents Extreme Y stretch */
					max-height: 100%;

					/* Vertical centering (Letterboxing) */
					margin: auto;
				}

				.rows-container {
					flex: 1;
					display: grid;

					/* The Grid Formula - auto-reflow based on container width */
					/* Single column by default */
					grid-template-columns: 1fr;

					/* Rows can grow but never below the interaction floor */
					grid-template-rows: repeat(${this.data.items.length}, minmax(${this.MIN_ITEM_HEIGHT}px, 1fr));

					gap: clamp(2px, min(0.6cqw, 0.6cqh), 6px);
					row-gap: clamp(2px, min(0.6cqw, 0.6cqh), 6px);
					column-gap: clamp(4px, min(1.2cqw, 1.2cqh), 10px);

					align-content: stretch;
					align-items: stretch;

					overflow-y: auto;
					overflow-x: hidden;
					min-height: 0;
					padding: clamp(6px, min(1.4cqw, 1.4cqh), 14px);

					/* Prevent excessive width */
					max-width: 100%;
					max-height: 100dvh;
					margin: auto;
					width: 100%;

					outline: 0 !important;

					overflow-y: scroll;
					text-size-adjust: 100%;
					box-sizing: border-box;
				}

				/* Height-driven reflow: only split columns when height is tight */
				@container rank-order (max-height: 520px) {
					.rows-container {
						grid-template-columns: repeat(2, 1fr);
						grid-template-rows: repeat(${Math.ceil(this.data.items.length / 2)}, minmax(${this.MIN_ITEM_HEIGHT}px, 1fr));
						column-gap: clamp(0.5rem, 2cqw, 1rem);
					}
				}

				@container rank-order (max-height: 440px) {
					.rows-container {
						grid-template-columns: repeat(3, 1fr);
						grid-template-rows: repeat(${Math.ceil(this.data.items.length / 3)}, minmax(${this.MIN_ITEM_HEIGHT}px, 1fr));
						column-gap: clamp(0.5rem, 2cqw, 1rem);
					}
				}

				.row {
					display: flex;
					align-items: stretch;
					background: transparent;
					border: 2px solid transparent;
					border-radius: clamp(4px, 1cqw, 6px);
					transition: all 0.2s ease;
					cursor: grab;
					gap: clamp(0.25rem, 1cqw, 0.5rem);
					position: relative;

					min-height: ${this.MIN_ITEM_HEIGHT}px;
					height: 100%;

					/* Fill the grid cell completely */
					width: 100%;
					box-sizing: border-box;
				}

				.row:hover:not(.dragging) {
					background: rgba(var(--edu-first-accent), 0.03);
					border-color: rgba(var(--edu-first-accent), 0.2);
				}

				.row:active {
					cursor: grabbing;
				}

				.row.drag-over {
					border-color: rgb(var(--edu-first-accent));
					background: rgba(var(--edu-first-accent), 0.15);
					transform: scale(1.02);
					box-shadow: 0 0 0 3px rgba(var(--edu-first-accent), 0.2);
				}

				.row.dragging {
					opacity: 0.6;
					transform: scale(0.95);
					cursor: grabbing;
					background: rgba(var(--edu-second-ink), 0.1);
					border-color: rgb(var(--edu-second-ink));
					box-shadow: 0 4px 12px rgba(var(--edu-shadow-color), 0.2);
				}

				.chip-wrapper {
					flex: 1;
					min-width: 0;
					height: 100%;
					display: flex;
				}

				edu-chip-scalable {
					width: 100%;
					height: 100%;
					flex: 1;
				}

				.controls {
					position: absolute;
					top: clamp(-14px, -2cqh, -10px);
					right: clamp(-14px, -2cqw, -10px);
					display: flex;
					align-items: center;
					justify-content: center;
					z-index: 10;
					opacity: 0;
					transition: opacity 0.2s ease;
					pointer-events: none;
				}

				.row:hover .controls,
				.row.dragging .controls {
					opacity: 1;
					pointer-events: auto;
				}

				.btn {
					display: flex;
					align-items: center;
					justify-content: center;
					background: rgb(var(--edu-card));
					border: 2px solid rgb(var(--edu-first-accent));
					cursor: pointer;
					transition: all 0.2s ease;
					box-shadow: 0 2px 6px rgba(var(--edu-shadow-color), 0.15);

					/* Compact circular buttons */
					width: clamp(28px, min(5cqw, 5cqh), 42px);
					height: clamp(28px, min(5cqw, 5cqh), 42px);
					min-width: 28px;
					min-height: 28px;
					flex-shrink: 0;
					border-radius: 50%;
					padding: 0;
					margin: 0;
				}

				.btn:hover:not(:disabled) {
					background: rgb(var(--edu-first-accent));
					border-color: rgb(var(--edu-first-accent));
					transform: scale(1.1);
					box-shadow: 0 4px 12px rgba(var(--edu-first-accent), 0.4);
				}

				.btn:hover:not(:disabled) img {
					filter: brightness(0) invert(1);
				}

				.btn:active:not(:disabled) {
					transform: scale(0.9);
				}

				.btn:disabled {
					opacity: 0.2;
					cursor: not-allowed;
					border-color: rgb(var(--edu-border));
				}

				.btn img {
					width: 60%;
					height: 60%;
					object-fit: contain;
					transition: filter 0.2s ease;
				}

				/* Mobile optimizations - ensure tight layout */
				@media (max-width: 640px) {
					.row {
						gap: 0.125rem;
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

			const chip = document.createElement('edu-chip-scalable') as EduChipScalable;
			chip.variant = this.variant;
			chip.dataset.item = item;
			chip.prefix = String(index + 1);
			chip.draggable = true;
			setUpChipDataScalable(item, chip, this.assets?.assetsById);

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

			// Controls - Only UP button as requested
			const controls = document.createElement('div');
			controls.className = 'controls';

			const upBtn = this.createButton('up', index);
			controls.appendChild(upBtn);

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
		btn.setAttribute('aria-label', direction === 'up' ? 'Move up' : 'Move down');

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
			? `<img src="assets/icons/up.svg" alt="^" />`
			: `<img src="assets/icons/down.svg" alt="v" />`;

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
		// Don't drag on button clicks or control elements
		if ((e.target as HTMLElement).closest('.btn, .controls')) return;

		e.preventDefault();
		e.stopPropagation();

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

		// Add visual feedback to container
		this.$rowsContainer.style.userSelect = 'none';
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
			// Swap items with animation feedback
			this.swapItems(this.draggedRowIndex, hoverIndex);
		}

		// Clean up all drag states
		this.$rowsContainer.querySelectorAll('.row').forEach(row => {
			row.classList.remove('dragging', 'drag-over');
		});

		// Reset container style
		this.$rowsContainer.style.userSelect = '';

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

		console.log(`Rank Order Scalable Score: ${result.score.toFixed(1)}% (${result.correct}/${result.total} correct)`);

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
if (!customElements.get('rank-order-scalable')) {
	customElements.define('rank-order-scalable', RankOrderScalable);
}
