/**
 * SEQUENTIAL CLASSIFICATION - Classify items one at a time
 *
 * interaction mechanics inspired from
 * @see https://learningapps.org
 */

import { BaseInteraction } from "../../../core/BaseInteraction";
import { Variant } from "../../../shared/types";
import { InteractionConfig, InteractionMechanic } from "../../../types/Interactions";
import { ClassificationData } from "../../../types/Data";
import { EduChip, EduBlock } from "../../../ui";
import { shuffle, randomHexColorsList } from "../../../shared";
import { classificationGrader } from "../utilities";

import { AnimationsManager } from "../../../shared/managers";

export class SequentialClassification extends BaseInteraction<ClassificationData> {

	interactionMechanic: InteractionMechanic = "automatic-sequencing";

	private categories: string[] = [];
	private allItems: string[] = [];
	
	private categorized: Map<string, string | null> = new Map();

	// ------------
	private container: HTMLDivElement;
	private centerZone: HTMLDivElement;
	private zones: EduBlock[] = [];
	private chips: EduChip[] = [];
	private activeChip: EduChip | null = null;
	private currentZone: HTMLDivElement | EduBlock | null = null;

	private isDragging: boolean = false;
	private startX: number = 0;
	private startY: number = 0;
	private offsetX: number = 0;
	private offsetY: number = 0;

	private boundPointerMove: (e: PointerEvent) => void;
	private boundPointerUp: (e: PointerEvent) => void;
	
	private variant: Variant;

	constructor(data: ClassificationData, config: InteractionConfig) {
		super(data, config);

		this.data.categories.forEach(({label, items}) => {
			this.categories.push(label);
			this.allItems.push(...items);
		});

		if (this.data.distractors) {
			console.warn("Found a distractor in a Sequential Classification interaction, those are not useful and will be ignored");
		}

		this.allItems = this.config.shuffle ? shuffle(this.allItems) : this.allItems;

		this.initializeProgress(this.allItems.length);

		this.boundPointerMove = this.handlePointerMove.bind(this);
		this.boundPointerUp = this.handlePointerUp.bind(this);

		this.variant = this.config.variant;
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
		this.querySelectorAll('edu-chip, edu-block').forEach((el: EduChip | EduBlock) => {
			if (el.variant !== undefined) el.variant = newVariant;
		});
		this.variant = newVariant;
	}

	// ==================== RENDERING ====================

	render(): void {
		const gridCols = Math.min(this.categories.length, 4);

		this.innerHTML = `
			<style>
				:host {
					display: block;
					width: 100%;
					height: 100%;
				}

				#container {
					position: relative;
					min-height: 400px;
					display: grid;
					grid-template-columns: repeat(${gridCols}, 1fr);
					grid-template-rows: auto 1fr;
					gap: 1rem;
					padding: 1.5rem;
					background: rgb(var(--edu-bg));
					border-radius: 12px;
				}

				#center-zone {
					grid-column: 1 / -1;
					min-height: 80px;
					display: flex;
					align-items: center;
					justify-content: center;
					background: rgba(var(--edu-muted), 0.5);
					border-radius: 12px;
					border: 2px dashed rgb(var(--edu-border));
				}

				#center-zone.empty::before {
					content: 'All items categorized!';
					color: rgb(var(--edu-third-ink));
					font-size: 0.9rem;
					opacity: 0.6;
				}

				.zone {
					border-radius: none;
					box-shadow: 0 4px 6px -1px rgb(var(--edu-shadow-color) / 0.1);
					transition: all 0.3s ease;
					font-weight: 700;
					font-size: 1.95rem;
					text-align: center;
					border: 3px solid transparent;
					opacity: 0.8;
				}
				
				.zone.highlight {
					transform: scale(1.02);
					opacity:1;
					font-size: 2.5rem;
				}

				edu-chip {
					position: absolute;
					cursor: grab;
					user-select: none;
					touch-action: none;
					transition: transform 0.2s ease;
				}

				edu-chip:hover {
					transform: scale(1.05);
				}

				edu-chip.dragging {
					cursor: grabbing;
					z-index: 1000;
					transform: scale(1.1);
				}

				@media (max-width: 1024px) {
					#container {
						grid-template-columns: repeat(${Math.min(gridCols, 2)}, 1fr);
					}
				}

				@media (max-width: 640px) {
					#container {
						grid-template-columns: 1fr;
						min-height: 300px;
					}
					#center-zone {
						min-height: 60px;
					}
				}
			</style>
			<div id="container">
				<div id="center-zone"></div>
			</div>
		`;

		this.container = this.querySelector("#container") as HTMLDivElement;
		this.centerZone = this.querySelector("#center-zone") as HTMLDivElement;

		this.createDropZones();
		this.showNextChip();
	}

	private createDropZones(): void {
		this.categories.forEach((label, i) => {
			const zone = document.createElement('edu-block') as EduBlock;
			zone.setAccentColor(randomHexColorsList[i % randomHexColorsList.length]);
			zone.classList.add('zone');
			zone.textContent = `${label}: 0`;
			zone.dataset.label = label;

			this.container.appendChild(zone);
			this.zones.push(zone);
		});
	}

	private showNextChip(): void {
		const nextItem = this.allItems.find(item => !this.categorized.has(item));
		if (!nextItem) {
			this.centerZone.classList.add('empty');
			return;
		}

		const chip = document.createElement("edu-chip") as EduChip;
		chip.variant = this.variant;
		chip.textContent = nextItem;
		chip.prefix = (this.allItems.indexOf(nextItem) + 1).toString();
		chip.draggable = true;
		chip.dataset.label = nextItem;

		chip.addEventListener("pointerdown", (e) => this.handlePointerDown(e, chip));

		this.container.appendChild(chip);
		this.chips.push(chip);

		// Center the chip after it's added to DOM
		requestAnimationFrame(() => {
			const centerRect = this.centerZone.getBoundingClientRect();
			const containerRect = this.container.getBoundingClientRect();
			const chipRect = chip.getBoundingClientRect();

			const x = (centerRect.left - containerRect.left) + (centerRect.width - chipRect.width) / 2;
			const y = (centerRect.top - containerRect.top) + (centerRect.height - chipRect.height) / 2;

			chip.style.left = `${x}px`;
			chip.style.top = `${y}px`;
		});
	}

	private handlePointerDown(e: PointerEvent, chip: EduChip): void {
		e.preventDefault();

		this.activeChip = chip;
		this.isDragging = true;
		chip.classList.add("dragging");

		const chipRect = chip.getBoundingClientRect();
		const containerRect = this.container.getBoundingClientRect();

		this.offsetX = e.clientX - chipRect.left;
		this.offsetY = e.clientY - chipRect.top;
		
		// THIS DOES NOT GET TRIGGERED IF THE CHIP IS *ONLY* CLICKED!
		this.handlePointerMove(e);
	}

	private handlePointerMove(e: PointerEvent): void {
		if (!this.isDragging || !this.activeChip) return;

		const containerRect = this.container.getBoundingClientRect();

		let x = e.clientX - containerRect.left - this.offsetX;
		let y = e.clientY - containerRect.top - this.offsetY;

		// Clamp to container bounds
		const chipRect = this.activeChip.getBoundingClientRect();
		x = Math.max(0, Math.min(x, containerRect.width - chipRect.width));
		y = Math.max(0, Math.min(y, containerRect.height - chipRect.height));

		this.activeChip.style.left = `${x}px`;
		this.activeChip.style.top = `${y}px`;

		this.checkZoneOverlap(e.clientX, e.clientY);
	}

	private handlePointerUp(e: PointerEvent): void {
		if (!this.isDragging || !this.activeChip) return;

		this.isDragging = false;
		this.activeChip.classList.remove("dragging");

		const itemLabel = this.activeChip.dataset.label!;

		if (this.currentZone) {
			const zoneLabel = this.currentZone.dataset.label!;
			const previousCategory = this.categorized.get(itemLabel);

			if (previousCategory !== zoneLabel) {

				this.categorized.set(itemLabel, zoneLabel);
				this.emitStateChange();

				if (previousCategory === undefined) {
					this.incrementProgress();
					this.showNextChip();
				}
				
				if (previousCategory === null) this.incrementProgress();
			}
		} else {
			if (this.categorized.get(itemLabel)) {
				this.categorized.set(itemLabel, null);
				this.decrementProgress();
			}
		}

		this.zones.forEach(zone => { 
			zone.classList.remove("highlight");
			zone.textContent = 
				`${zone.dataset.label}: ${Array.from(this.categorized.values()).filter(v => v === zone.dataset.label).length ?? ''}`;
		});

		this.activeChip = null;
		this.currentZone = null;
	}

	private checkZoneOverlap(clientX: number, clientY: number): void {
		this.currentZone = null;
		for (const zone of this.zones) {
			const rect = zone.getBoundingClientRect();

			if (clientX >= rect.left && clientX <= rect.right &&
			    clientY >= rect.top && clientY <= rect.bottom) {
				zone.classList.add("highlight");
				this.currentZone = zone;
			} else {
				zone.classList.remove("highlight");
			}
		}
	}

	// ==================== INTERACTION LOGIC ====================

	getCurrentState(): any {
		return {
			categorized: Object.fromEntries(this.categorized),
			progress: this.progressTracker.current
		};
	}

	isInteractionComplete(): boolean {
		return this.categorized.size === this.allItems.length;
	}

	onHint(): void {
		const uncategorized = this.allItems.filter(item => !this.categorized.has(item));

		if (uncategorized.length === 0) {
			alert('All items are categorized! Click "Check" to submit.');
			this.emitHintShown('All items categorized');
			return;
		}

		const firstUncategorized = uncategorized[0];
		const correctCategory = this.data.categories.find(cat =>
			cat.items.includes(firstUncategorized)
		)?.label;

		if (correctCategory) {
			alert(`Hint: "${firstUncategorized}" belongs to "${correctCategory}".`);
			this.emitHintShown(`Item: ${firstUncategorized} → Category: ${correctCategory}`);
		}
	}

	public submit(): void {
		super.submit();
		const result = classificationGrader(this.data.categories, this.categorized, this);
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
		this.categorized.clear();

		// Remove all chips
		this.chips.forEach(chip => chip.remove());
		this.chips = [];

		this.centerZone.classList.remove('empty');
		this.activeChip = null;
		this.currentZone = null;
		this.isDragging = false;

		this.showNextChip();
	}
}

if (!customElements.get('sequential-classification')) {
	customElements.define('sequential-classification', SequentialClassification);
}
