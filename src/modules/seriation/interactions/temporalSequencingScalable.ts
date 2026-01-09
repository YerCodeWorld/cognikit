
import { BaseInteraction } from "../../../core/BaseInteraction";
import { Variant } from "../../../shared/types";

import { InteractionConfig, InteractionMechanic } from "../../../types/Interactions";
import { NormalizedAssets } from "../../../shared/assets";
import { SeriationData } from "../../../types/Data";

import { EduChipScalable, setUpChipDataScalable } from "../../../ui/misc/chip-scalable/chip";
import { EduBlockScalable } from "../../../ui/misc/block-scalable/block";

import { shuffle, randomHexColorsList} from "../../../shared";
import { seriationGrader, seriationValidator } from "../utilities";

/**
 * TemporalSequencingScalable - A scalable version of TemporalSequencing
 *
 * Features based on UI.md:
 * - Container-driven scaling (uses container queries)
 * - Auto-reflow grid (timeline adapts to aspect ratio)
 * - Scalable chips and blocks
 * - No overflow - everything fits
 * - Aspect-ratio aware layout transitions
 */
export class TemporalSequencingScalable extends BaseInteraction<SeriationData> {
	interactionMechanic: InteractionMechanic = "static";

	private correctOrder: string[] = [];
	private currentOrder: string[] = [];
	private unplacedItems: string[] = [];

	private container: HTMLDivElement;
	private timelineContainer: HTMLDivElement;
	private itemsPool: HTMLDivElement;

	private chips: Map<string, EduChipScalable> = new Map();
	private timelineSlots: EduBlockScalable[] = [];

	private selectedChip: EduChipScalable | null = null;

	private variant: Variant;

	// Scalability constants
	private readonly MAX_ITEMS = 10; // Cognitive Ceiling
	private readonly MIN_SLOT_SIZE = 44; // Interaction Floor (px)

	constructor(
		data: SeriationData,
		config: InteractionConfig,
		assets?: NormalizedAssets | null
	) {

		super(data, config, assets, seriationValidator);

		// Parent class now handles undefined data gracefully
		if (!this.isValid || !this.data) return;

		this.correctOrder = [...this.data.items];
		this.unplacedItems = this.config.shuffle
			? shuffle([...this.data.items])
			: [...this.data.items];

		this.initializeProgress(this.data.items.length);

		this.variant = this.config.variant || 'outline';
	}

	protected initialize(): void {}

	protected cleanup(): void {}

	onVariantChange(newVariant: Variant): void {
		this.querySelectorAll('edu-chip-scalable').forEach((chip: EduChipScalable) => {
			chip.variant = newVariant;
		});
		this.querySelectorAll('edu-block-scalable').forEach((block: EduBlockScalable) => {
			block.variant = newVariant;
		});
		this.variant = newVariant;
	}

	// ==================== RENDERING ====================

	render(): void {
		const totalSlots = this.correctOrder.length;

		this.innerHTML = `
			<style>
				temporal-sequencing-scalable {
					display: flex;
					width: 100%;
					height: 100%;
					box-sizing: border-box;

					/* Enable container queries */
					container-type: size;
					container-name: temporal-sequencing;
				}

				#container.drag-active edu-block-scalable::part(block) { transform: none !important; }

				#container {
					display: flex;
					flex-direction: column;
					width: 100%;
					height: 100%;
					gap: clamp(0.5rem, 2cqh, 1rem);
					background: rgb(var(--edu-bg));
					border-radius: clamp(8px, 2cqw, 12px);
					overflow: hidden;
					box-sizing: border-box;
					padding: 0;
				}

				#timeline-container {
					flex: 1;
					display: flex;
					flex-direction: column;
					gap: clamp(0.25rem, 1cqh, 0.5rem);
					min-height: 0;
					overflow: hidden;
					padding: clamp(0.5rem, 2cqh, 1rem);
				}

				.timeline-label {
					font-size: clamp(0.75rem, 2cqh, 0.9rem);
					font-weight: 600;
					color: rgb(var(--edu-second-ink));
					flex-shrink: 0;
				}

				#timeline {
					flex: 1;
					display: grid;

					/* Default: 2 columns for better space usage */
					grid-template-columns: repeat(2, 1fr);
					grid-auto-rows: minmax(${this.MIN_SLOT_SIZE}px, 1fr);
					grid-auto-flow: dense;

					gap: clamp(0.25rem, min(1cqw, 1cqh), 0.75rem);

					background: rgba(var(--edu-muted), 0.3);
					border-radius: clamp(8px, 2cqw, 12px);
					border: 2px solid rgb(var(--edu-border));
					position: relative;

					overflow-y: auto;
					overflow-x: hidden;
					align-content: start;
					align-items: stretch;

					padding: clamp(0.5rem, min(2cqw, 2cqh), 1rem);
					min-height: 0;
					box-sizing: border-box;
				}

				/* Very tall viewports: use single column */
				@container temporal-sequencing (min-height: 800px) and (max-aspect-ratio: 1/1.5) {
					#timeline {
						grid-template-columns: 1fr;
					}
				}

				/* Very tight height: 3 columns */
				@container temporal-sequencing (max-height: 480px) {
					#timeline {
						grid-template-columns: repeat(3, 1fr);
					}
				}

				/* Wide aspect ratio: more columns */
				@container temporal-sequencing (min-aspect-ratio: 2/1) {
					#timeline {
						grid-template-columns: repeat(auto-fit, minmax(max(${this.MIN_SLOT_SIZE}px, 15cqw), 1fr));
					}
				}

				edu-block-scalable.timeline-slot {
					position: relative;
					min-height: ${this.MIN_SLOT_SIZE}px;
					height: 100%;
					display: flex;
					flex-direction: column;
					align-items: stretch;
					justify-content: center;
					transition: all 0.3s ease;
					z-index: 1;
					box-sizing: border-box;
					cursor: pointer;
				}

				/* Alternating pattern: 1 full-width, 2 half-width, repeat */
				/* Pattern: [FULL] [HALF][HALF] [FULL] [HALF][HALF] ... */
				edu-block-scalable.timeline-slot:nth-child(3n+1) {
					grid-column: span 2;
				}

				/* On single column layouts, reset spans */
				@container temporal-sequencing (min-height: 800px) and (max-aspect-ratio: 1/1.5) {
					edu-block-scalable.timeline-slot:nth-child(3n+1) {
						grid-column: span 1;
					}
				}

				/* On 3+ column layouts, reset spans (let items flow naturally) */
				@container temporal-sequencing (max-height: 480px) {
					edu-block-scalable.timeline-slot:nth-child(3n+1) {
						grid-column: span 1;
					}
				}

				/* On very wide layouts, reset spans */
				@container temporal-sequencing (min-aspect-ratio: 2/1) {
					edu-block-scalable.timeline-slot:nth-child(3n+1) {
						grid-column: span 1;
					}
				}

				edu-block-scalable.timeline-slot:hover {
					transform: scale(1.02);
					box-shadow: 0 clamp(2px, 1cqh, 4px) clamp(6px, 2cqh, 12px) rgba(var(--edu-shadow-color), 0.15);
				}

				edu-block-scalable.timeline-slot edu-chip-scalable {
					width: 100%;
					height: 100%;
					box-sizing: border-box;
				}

				edu-block-scalable::part(block) {
					height: 100%;
				}

				edu-block-scalable.timeline-slot edu-chip-scalable:not(.dragging) {
					animation: chipSettle 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
				}

				#items-pool edu-chip-scalable:not(.dragging) {
					animation: chipSettle 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
				}

				@keyframes chipSettle {
					0% {
						transform: scale(0.95);
						opacity: 0.8;
					}
					50% {
						transform: scale(1.05);
					}
					100% {
						transform: scale(1);
						opacity: 1;
					}
				}

				@keyframes timelinePulse {
					0%, 100% {
						opacity: 0.4;
					}
					50% {
						opacity: 0.6;
					}
				}

				#timeline::before {
					animation: timelinePulse 3s ease-in-out infinite;
				}

				edu-block-scalable.timeline-slot::before {
					content: attr(data-position);
					position: absolute;
					top: clamp(-10px, -2cqh, -6px);
					left: 50%;
					transform: translateX(-50%);
					background: rgb(var(--edu-first-accent));
					color: rgb(var(--edu-inverted-ink));
					font-size: clamp(0.65rem, 2cqh, 0.75rem);
					font-weight: 700;
					width: clamp(20px, 4cqh, 24px);
					height: clamp(20px, 4cqh, 24px);
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					box-shadow: 0 2px 4px rgba(var(--edu-shadow-color), 0.2);
					z-index: 10;
				}

				edu-block-scalable.timeline-slot.empty::after {
					content: 'Drop here';
					color: rgb(var(--edu-third-ink));
					font-size: clamp(0.7rem, 2cqh, 0.8rem);
					opacity: 0.5;
				}

				edu-block-scalable.timeline-slot.filled::after {
					content: none;
				}

				#items-pool-container {
					flex-shrink: 0;
					display: flex;
					flex-direction: column;
					gap: clamp(0.25rem, 1cqh, 0.5rem);
					padding: 0 clamp(0.5rem, 2cqw, 1rem) clamp(0.5rem, 2cqh, 1rem);
					max-height: clamp(120px, 30cqh, 200px);
				}

				.pool-label {
					font-size: clamp(0.75rem, 2cqh, 0.9rem);
					font-weight: 600;
					color: rgb(var(--edu-second-ink));
					flex-shrink: 0;
				}

				#items-pool {
					display: grid;
					/* Multiple columns to avoid vertical overflow */
					grid-template-columns: repeat(auto-fill, minmax(clamp(100px, 20cqw, 180px), 1fr));
					grid-auto-rows: minmax(${this.MIN_SLOT_SIZE}px, max-content);
					gap: clamp(0.25rem, min(0.8cqw, 0.8cqh), 0.5rem);

					/* No background or border - invisible container */
					background: transparent;
					border: none;

					min-height: ${this.MIN_SLOT_SIZE}px;
					max-height: 100%;
					overflow-y: auto;
					overflow-x: hidden;
					align-content: start;
					align-items: stretch;
					flex-shrink: 0;
					padding: 0;
					cursor: default;
					box-sizing: border-box;
				}

				/* Show different cursor when a chip is selected (for returning to pool) */
				#container.has-selection #items-pool {
					cursor: pointer;
				}

				#items-pool.empty::before {
					content: 'All items placed!';
					color: rgb(var(--edu-third-ink));
					font-size: clamp(0.8rem, 2.5cqh, 0.9rem);
					opacity: 0.6;
					width: 100%;
					text-align: center;
					display: flex;
					align-items: center;
					justify-content: center;
					grid-column: 1 / -1;
				}

				#items-pool edu-chip-scalable {
					width: 100%;
					min-height: ${this.MIN_SLOT_SIZE}px;
					height: 100%;
				}

				edu-chip-scalable {
					user-select: none;
					cursor: pointer;
					transition: transform 0.2s ease, box-shadow 0.2s ease;
				}

				edu-chip-scalable:hover {
					transform: translateY(-2px);
					box-shadow: 0 clamp(2px, 1cqh, 4px) clamp(4px, 1.5cqh, 8px) rgba(var(--edu-shadow-color), 0.15);
				}

				edu-chip-scalable.dragging {
					position: fixed !important;
					z-index: 1000;
				}
			</style>
			<div id="container">
				<div id="timeline-container">
					<div id="timeline"></div>
				</div>
				<div id="items-pool-container">
					<div class="pool-label">Available Items</div>
					<div id="items-pool"></div>
				</div>
			</div>
		`;

		this.container = this.querySelector("#container") as HTMLDivElement;
		this.timelineContainer = this.querySelector("#timeline") as HTMLDivElement;
		this.itemsPool = this.querySelector("#items-pool") as HTMLDivElement;

		// Click on pool to return selected chip
		this.itemsPool.addEventListener('click', (e) => {
			// Only handle clicks on the pool itself, not on chips
			if (e.target === this.itemsPool) {
				this.handlePoolClick();
			}
		});

		this.createTimelineSlots(totalSlots);
		this.createItemChips();
	}

	private createTimelineSlots(count: number): void {
		for (let i = 0; i < count; i++) {
			const slot = document.createElement('edu-block-scalable') as EduBlockScalable;
			slot.variant = this.variant;
			slot.classList.add('timeline-slot');
			slot.style.setProperty("--accent-color", randomHexColorsList[i % randomHexColorsList.length]);
			slot.dataset.position = (i + 1).toString();
			slot.dataset.index = i.toString();

			// Click to assign selected chip to this slot
			slot.addEventListener('click', () => this.handleSlotClick(slot, i));

			this.timelineContainer.appendChild(slot);
			this.timelineSlots.push(slot);
		}
	}

	private createItemChips(): void {
		this.unplacedItems.forEach((item) => {
			const chip = this.createChip(item);
			this.itemsPool.appendChild(chip);
		});
	}

	private createChip(item: string): EduChipScalable {
		const chip = document.createElement('edu-chip-scalable') as EduChipScalable;
		chip.variant = this.variant;
		chip.dataset.item = item;

		setUpChipDataScalable(item, chip, this.assets?.assetsById);
		this.chips.set(item, chip);

		// Click to select chip - stop propagation to prevent slot click
		chip.addEventListener('click', (e) => {
			e.stopPropagation();
			this.handleChipClick(chip);
		});
		return chip;
	}

	// ==================== CLICK & ASSIGN ====================

	private handleChipClick(chip: EduChipScalable): void {
		// If this chip is already selected, deselect it
		if (this.selectedChip === chip) {
			this.selectedChip.selected = false;
			this.selectedChip = null;
			this.container.classList.remove('has-selection');
			return;
		}

		// If another chip is selected, swap them (if both are in timeline)
		if (this.selectedChip) {
			const selectedItem = this.selectedChip.dataset.item!;
			const clickedItem = chip.dataset.item!;
			const selectedIndex = this.currentOrder.indexOf(selectedItem);
			const clickedIndex = this.currentOrder.indexOf(clickedItem);

			// Both chips must be in the timeline to swap
			if (selectedIndex !== -1 && clickedIndex !== -1) {
				// Swap positions
				this.currentOrder[selectedIndex] = clickedItem;
				this.currentOrder[clickedIndex] = selectedItem;

				// Deselect
				this.selectedChip.selected = false;
				this.selectedChip = null;
				this.container.classList.remove('has-selection');

				this.updateDisplay();
				this.emitStateChange();
				return;
			}

			// Otherwise, just change selection
			this.selectedChip.selected = false;
		}

		// Select this chip
		this.selectedChip = chip;
		chip.selected = true;
		this.container.classList.add('has-selection');
	}

	private handleSlotClick(slot: EduBlockScalable, index: number): void {
		// If no chip is selected, do nothing
		if (!this.selectedChip) return;

		const item = this.selectedChip.dataset.item!;
		const currentIndex = this.currentOrder.indexOf(item);
		const occupant = this.currentOrder[index];

		if (currentIndex !== -1) {
			// Chip is currently in timeline - swap or move
			if (occupant) {
				// Swap items
				this.currentOrder[index] = item;
				this.currentOrder[currentIndex] = occupant;
			} else {
				// Move to empty slot
				this.currentOrder[currentIndex] = null;
				this.currentOrder[index] = item;
			}
		} else {
			// Chip is from pool
			if (occupant) {
				// Swap with occupant (send occupant to pool)
				this.currentOrder[index] = item;
				this.unplacedItems = this.unplacedItems.filter(i => i !== item);
				this.unplacedItems.push(occupant);
			} else {
				// Place in empty slot
				this.currentOrder[index] = item;
				this.unplacedItems = this.unplacedItems.filter(i => i !== item);
				this.incrementProgress();
			}
		}

		// Deselect chip
		this.selectedChip.selected = false;
		this.selectedChip = null;
		this.container.classList.remove('has-selection');

		this.updateDisplay();
		this.emitStateChange();
	}

	private handlePoolClick(): void {
		// If no chip is selected, do nothing
		if (!this.selectedChip) return;

		const item = this.selectedChip.dataset.item!;
		const currentIndex = this.currentOrder.indexOf(item);

		// Only handle chips that are currently in timeline
		if (currentIndex !== -1) {
			// Remove from timeline and return to pool
			this.currentOrder[currentIndex] = null;
			this.unplacedItems.push(item);
			this.decrementProgress();

			// Deselect chip
			this.selectedChip.selected = false;
			this.selectedChip = null;
			this.container.classList.remove('has-selection');

			this.updateDisplay();
			this.emitStateChange();
		}
	}

	private updateDisplay(): void {
		this.timelineSlots.forEach((slot, index) => {
			slot.innerHTML = '';
			const item = this.currentOrder[index];
			if (item) {
				const chip = this.chips.get(item);
				if (chip) {
					// Ensure chip maintains selection state
					const wasSelected = this.selectedChip === chip;
					slot.appendChild(chip);
					chip.selected = wasSelected;
					slot.classList.remove('empty');
					slot.classList.add('filled');
				}
			} else {
				slot.classList.remove('filled');
				slot.classList.add('empty');
			}
		});

		this.itemsPool.innerHTML = '';
		this.unplacedItems.forEach(item => {
			const chip = this.chips.get(item);
			if (chip) {
				// Ensure chip maintains selection state
				const wasSelected = this.selectedChip === chip;
				this.itemsPool.appendChild(chip);
				chip.selected = wasSelected;
			}
		});

		if (this.unplacedItems.length === 0) {
			this.itemsPool.classList.add('empty');
		} else {
			this.itemsPool.classList.remove('empty');
		}
	}

	// ==================== INTERACTION LOGIC ====================

	getCurrentState(): any {
		return {
			currentOrder: this.currentOrder.filter(item => item !== null),
			unplacedItems: this.unplacedItems,
			progress: this.progressTracker.current
		};
	}

	isInteractionComplete(): boolean {
		return this.unplacedItems.length === 0 &&
		       this.currentOrder.every(item => item !== null);
	}

	onHint(): void {
		for (let i = 0; i < this.correctOrder.length; i++) {
			const correctItem = this.correctOrder[i];
			const currentItem = this.currentOrder[i];

			if (correctItem !== currentItem) {
				if (currentItem === null) {
					alert(`Hint: Position ${i + 1} should be "${correctItem}"`);
					this.emitHintShown(`Position ${i + 1}: ${correctItem}`);
				} else {
					alert(`Hint: "${currentItem}" is in the wrong position. Try position ${this.correctOrder.indexOf(currentItem) + 1}`);
					this.emitHintShown(`"${currentItem}" should be at position ${this.correctOrder.indexOf(currentItem) + 1}`);
				}
				return;
			}
		}

		alert('Everything looks good! Click "Check" to submit.');
		this.emitHintShown('All items correctly placed');
	}

	public submit(): void {
		super.submit();

		const userOrder = this.currentOrder.filter(item => item !== null);
		const result = seriationGrader(this.correctOrder, userOrder, this);

		console.log(`Temporal Sequencing Scalable Score: ${result.score.toFixed(1)}% (${result.correct}/${result.total} correct)`);

		this.dispatchEvent(new CustomEvent('interaction:graded', {
			detail: { result },
			bubbles: true,
			composed: true
		}));
	}

	// ==================== RESET ====================
	public reset(): void {
		super.reset();

		this.currentOrder = [];
		this.unplacedItems = this.config.shuffle
			? shuffle([...this.correctOrder])
			: [...this.correctOrder];

		// Clear selection
		if (this.selectedChip) {
			this.selectedChip.selected = false;
			this.selectedChip = null;
		}

		this.chips.clear();
		this.timelineSlots = [];

		this.render();

		// Remove has-selection class after render
		this.container?.classList.remove('has-selection');
	}
}

if (!customElements.get('temporal-sequencing-scalable')) {
	customElements.define('temporal-sequencing-scalable', TemporalSequencingScalable);
}
