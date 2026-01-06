
import { BaseInteraction } from "../../../core/BaseInteraction";
import { Variant } from "../../../shared/types";

import { InteractionConfig, InteractionMechanic } from "../../../types/Interactions";
import { NormalizedAssets } from "../../../shared/assets";
import { SeriationData } from "../../../types/Data";

import { EduChip, setUpChipData } from "../../../ui/misc/chip";
import { EduBlock } from "../../../ui/misc/block";

import { shuffle, randomHexColorsList} from "../../../shared";
import { seriationGrader, seriationValidator } from "../utilities";

export class TemporalSequencing extends BaseInteraction<SeriationData> {
	interactionMechanic: InteractionMechanic = "static";

	private correctOrder: string[] = [];
	private currentOrder: string[] = [];
	private unplacedItems: string[] = [];

	private container: HTMLDivElement;
	private timelineContainer: HTMLDivElement;
	private itemsPool: HTMLDivElement;

	private chips: Map<string, EduChip> = new Map();
	private timelineSlots: EduBlock[] = [];
	private currentSlot: EduBlock | null = null;

	private isDragging: boolean = false;
	private draggedChip: EduChip | null = null;
	private draggedFrom: 'timeline' | 'pool' | null = null;
	private dragStartIndex: number = -1;

	private offsetX: number = 0;
	private offsetY: number = 0;

	private boundPointerMove: (e: PointerEvent) => void;
	private boundPointerUp: (e: PointerEvent) => void;

	private variant: Variant;

	constructor(
		data: SeriationData,
		config: InteractionConfig,
		assets?: NormalizedAssets | null
	) {

		super(data, config, assets, seriationValidator);

		this.correctOrder = [...this.data.items];
		this.unplacedItems = this.config.shuffle
			? shuffle([...this.data.items])
			: [...this.data.items];

		this.initializeProgress(this.data.items.length);

		this.boundPointerMove = this.handlePointerMove.bind(this);
		this.boundPointerUp = this.handlePointerUp.bind(this);

		this.variant = this.config.variant || 'outline';
	}

	protected initialize(): void {
		window.addEventListener("pointermove", this.boundPointerMove);
		window.addEventListener("pointerup", this.boundPointerUp);
	}

	protected cleanup(): void {
		window.removeEventListener("pointermove", this.boundPointerMove);
		window.removeEventListener("pointerup", this.boundPointerUp);
	}

	onVariantChange(newVariant: Variant): void {
		this.querySelectorAll('edu-chip').forEach((chip: EduChip) => {
			chip.variant = newVariant;
		});
		this.querySelectorAll('edu-block').forEach((block: EduBlock) => {
			block.variant = newVariant;
		});
		this.variant = newVariant;
	}

	// ==================== RENDERING ====================

	render(): void {
		const totalSlots = this.correctOrder.length;

		this.innerHTML = `
			<style>
				:host {
					display: flex;
					width: 100%;
					height: 100%;
					box-sizing: border-box;
				}

				#container.drag-active edu-block::part(block) { transform: none !important; }

				#container {
					display: flex;
					flex-direction: column;
					width: 100%;
					height: 100%;
					gap: 1.5rem;
					padding: 1.5rem;
					background: rgb(var(--edu-bg));
					border-radius: 12px;
					overflow: hidden;
					box-sizing: border-box;
				}

				#timeline-container {
					flex: 1;
					display: flex;
					flex-direction: column;
					gap: 0.5rem;
					min-height: 0;
					overflow: hidden;
				}

				.timeline-label {
					font-size: 0.9rem;
					font-weight: 600;
					color: rgb(var(--edu-second-ink));
					flex-shrink: 0;
				}

				#timeline {
					flex: 1;
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
					grid-auto-rows: minmax(100px, max-content);
					gap: 0.75rem;
					padding: 1rem;
					background: rgba(var(--edu-muted), 0.3);
					border-radius: 12px;
					border: 2px solid rgb(var(--edu-border));
					position: relative;
					overflow-y: auto;
					overflow-x: hidden;
					align-content: start;
					min-height: 0;
				}

				edu-block.timeline-slot {
					position: relative;
					min-height: 80px;
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					transition: all 0.3s ease;
					z-index: 1;
					box-sizing: border-box;
				}

				edu-block.timeline-slot edu-chip {
					max-width: 100%;
					box-sizing: border-box;
				}

				edu-block.timeline-slot edu-chip:not(.dragging) {
					animation: chipSettle 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
				}

				#items-pool edu-chip:not(.dragging) {
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

				edu-block.timeline-slot::before {
					content: attr(data-position);
					position: absolute;
					top: -0.75rem;
					left: 50%;
					transform: translateX(-50%);
					background: rgb(var(--edu-first-accent));
					color: rgb(var(--edu-inverted-ink));
					font-size: 0.75rem;
					font-weight: 700;
					width: 1.5rem;
					height: 1.5rem;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					box-shadow: 0 2px 4px rgba(var(--edu-shadow-color), 0.2);
					z-index: 1;
				}

				edu-block.timeline-slot.empty::after {
					content: 'Drop here';
					color: rgb(var(--edu-third-ink));
					font-size: 0.8rem;
					opacity: 0.5;
				}

				edu-block.timeline-slot.filled::after {
					content: none;
				}

				#items-pool-container {
					flex-shrink: 0;
					display: flex;
					flex-direction: column;
					gap: 0.5rem;
				}

				.pool-label {
					font-size: 0.9rem;
					font-weight: 600;
					color: rgb(var(--edu-second-ink));
					flex-shrink: 0;
				}

				#items-pool {
					display: flex;
					gap: 0.75rem;
					padding: 1rem;
					background: rgba(var(--edu-muted), 0.5);
					border-radius: 12px;
					border: 2px dashed rgb(var(--edu-border));
					min-height: 80px;
					max-height: 150px;
					overflow-y: hidden;
					overflow-x: auto;
					align-items: flex-start;
					flex-shrink: 0;
				}

				#items-pool.empty::before {
					content: 'All items placed!';
					color: rgb(var(--edu-third-ink));
					font-size: 0.9rem;
					opacity: 0.6;
					width: 100%;
					text-align: center;
					margin-top: 1rem;
				}

				edu-chip.dragging {
					position: fixed !important;
					z-index: 2;
					pointer-events: none;
				}

				@media (max-width: 768px) {
					#timeline {
						grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
						gap: 0.5rem;
						padding: 0.75rem;
					}

					edu-block.timeline-slot {
						min-height: 70px;
					}

					#container {
						padding: 1rem;
						gap: 1rem;
					}

					#items-pool {
						max-height: 120px;
					}
				}

				@media (max-width: 480px) {
					#timeline {
						grid-template-columns: 1fr 1fr;
						gap: 0.5rem;
					}

					#timeline::before {
						width: 3px;
						height: calc(100% - 2rem);
						left: 1rem;
						right: auto;
						top: 1rem;
						transform: none;
					}

					edu-block.timeline-slot {
						max-width: 125px;
					}

					edu-block.timeline-slot::before {
						left: -0.75rem;
						top: 50%;
						transform: translateY(-50%);
					}

					#items-pool {
						max-height: 100px;
					}
				}
			</style>
			<div id="container">
				<div id="timeline-container">
					<div class="timeline-label">Timeline (Drag items to arrange in order)</div>
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

		this.createTimelineSlots(totalSlots);
		this.createItemChips();
	}

	private createTimelineSlots(count: number): void {
		for (let i = 0; i < count; i++) {
			const slot = document.createElement('edu-block') as EduBlock;
			slot.variant = this.variant;
			slot.classList.add('timeline-slot');
			slot.style.setProperty("--accent-color", randomHexColorsList[i % randomHexColorsList.length]);
			slot.dataset.position = (i + 1).toString();
			slot.dataset.index = i.toString();

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

	private createChip(item: string): EduChip {
		const chip = document.createElement('edu-chip') as EduChip;
		chip.draggable = true;
		chip.variant = this.variant;
		chip.dataset.item = item;

		setUpChipData(item, chip, this.assets?.assetsById);
		this.chips.set(item, chip);

		chip.addEventListener('pointerdown', (e) => this.handlePointerDown(e, chip));
		return chip;
	}

	// ==================== DRAG & DROP ====================

	private handlePointerDown(e: PointerEvent, chip: EduChip): void {
		e.preventDefault();
		e.stopPropagation();

		chip.setPointerCapture(e.pointerId);
		const chipRect = chip.getBoundingClientRect();
		
		this.offsetX = e.clientX - chipRect.left;
		this.offsetY = e.clientY - chipRect.top;

		const timelineIndex = this.currentOrder.indexOf(chip.dataset.item!);
		if (timelineIndex !== -1) {
			this.draggedFrom = 'timeline';
			this.dragStartIndex = timelineIndex;
			this.classList.add("drag-active");

		} else {
			this.draggedFrom = 'pool';
			this.dragStartIndex = -1;
		}

		this.isDragging = true;
		this.container.classList.add('drag-active');
		this.draggedChip = chip;
		
		// oh heavens! gimme a break! 
		this.currentSlot = chip.parentNode as EduBlock;
		this.currentSlot.dataset.z = this.currentSlot.style.zIndex;
		this.currentSlot.style.zIndex = '10';

		chip.classList.add('dragging');
		chip.style.width = `${chipRect.width}px`;
		chip.style.left = `${chipRect.left}px`;
		chip.style.top = `${chipRect.top}px`;
	}

	private handlePointerMove(e: PointerEvent): void {
		if (!this.isDragging || !this.draggedChip) return;
		let newLeft = e.clientX - this.offsetX;
		let newTop = e.clientY - this.offsetY;

		const containerRect = this.container.getBoundingClientRect();
		const chipWidth = this.draggedChip.offsetWidth;
		const chipHeight = this.draggedChip.offsetHeight;

		newLeft = Math.max(containerRect.left, Math.min(newLeft, containerRect.right - chipWidth));
		newTop = Math.max(containerRect.top, Math.min(newTop, containerRect.bottom - chipHeight));

		this.draggedChip.style.left = `${newLeft}px`;
		this.draggedChip.style.top = `${newTop}px`;

	}

	private handlePointerUp(e: PointerEvent): void {
		if (!this.isDragging || !this.draggedChip) return;
		
		this.currentSlot.style.zIndex = this.currentSlot.dataset.z;
		this.currentSlot = null;

		const dropTarget = this.getDropTarget(e.clientX, e.clientY);
		const item = this.draggedChip.dataset.item!;

		if (this.draggedFrom === 'timeline' && this.dragStartIndex !== -1) {
			this.currentOrder[this.dragStartIndex] = null;
		}

		if (dropTarget && dropTarget.type === 'timeline') {
			const targetIndex = parseInt(dropTarget.element.dataset.index!);

			const occupant = this.currentOrder[targetIndex];
			if (occupant) {
				this.currentOrder[targetIndex] = item;
				if (this.draggedFrom === 'timeline') {
					this.currentOrder[this.dragStartIndex] = occupant;
				} else {
					this.unplacedItems = this.unplacedItems.filter(i => i !== item);
					this.unplacedItems.push(occupant);
				}
			} else {
				this.currentOrder[targetIndex] = item;
				if (this.draggedFrom === 'pool') {
					this.unplacedItems = this.unplacedItems.filter(i => i !== item);
					this.incrementProgress();
				}
			}
		} else {
			if (this.draggedFrom === 'timeline') {
				this.unplacedItems.push(item);
				this.decrementProgress();
			}
		}

		this.draggedChip.classList.remove('dragging');
		this.draggedChip.style.left = '';
		this.draggedChip.style.top = '';
		this.draggedChip.style.width = '';

		this.isDragging = false;
		this.classList.remove('drag-active');
		this.draggedChip = null;
		this.draggedFrom = null;
		this.dragStartIndex = -1;

		this.updateDisplay();
		this.emitStateChange();
	}

	private getDropTarget(clientX: number, clientY: number): { type: 'timeline' | 'pool', element: HTMLElement } | null {
		for (const slot of this.timelineSlots) {
			const rect = slot.getBoundingClientRect();
			if (clientX >= rect.left && clientX <= rect.right &&
			    clientY >= rect.top && clientY <= rect.bottom) {
				return { type: 'timeline', element: slot };
			}
		}

		const poolRect = this.itemsPool.getBoundingClientRect();
		if (clientX >= poolRect.left && clientX <= poolRect.right &&
		    clientY >= poolRect.top && clientY <= poolRect.bottom) {
			return { type: 'pool', element: this.itemsPool };
		}

		return null;
	}

	private updateDisplay(): void {
		this.timelineSlots.forEach((slot, index) => {
			slot.innerHTML = '';
			const item = this.currentOrder[index];
			if (item) {
				const chip = this.chips.get(item);
				if (chip) {
					slot.appendChild(chip);
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
			if (chip) this.itemsPool.appendChild(chip);
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

		console.log(`Temporal Sequencing Score: ${result.score.toFixed(1)}% (${result.correct}/${result.total} correct)`);

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

		this.chips.clear();
		this.timelineSlots = [];

		this.render();
	}
}

if (!customElements.get('temporal-sequencing')) {
	customElements.define('temporal-sequencing', TemporalSequencing);
}
