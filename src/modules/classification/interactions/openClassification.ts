/**
 * Open Classification 
 *
 * No idea if there's something like out there, but it's something I just came with
 */

import { BaseInteraction } from "../../../core/BaseInteraction";
import { Variant } from "../../../shared/types";

import { InteractionConfig, InteractionMechanic } from "../../../types/Interactions";
import { NormalizedAssets } from "../../../shared/assets";
import { ClassificationData } from "../../../types/Data";

import { EduChip, setUpChipData } from "../../../ui/misc/chip";
import { EduBlock } from "../../../ui/misc/block";

import { shuffle } from "../../../shared";
import { classificationGrader } from "../utilities";

export class OpenClassification extends BaseInteraction<ClassificationData> {
	
	interactionMechanic: InteractionMechanic = "static";

	private categories: string[] = ["none"];
	private allItems: string[] = [];

	private categoryColors: string[] = [
		'#94a3b8',
		'#3b82f6',
		'#10b981',
		'#f59e0b',
		'#ef4444',
		'#8b5cf6',
		'#ec4899',
		'#14b8a6',
		'#f97316',
		'#6366f1'
	];

	private categorized: Map<string, string>;
	private currentCategory: string;
	private currentColor: string = this.categoryColors[0];

	// DOM elements
	private $categoriesBar!: HTMLDivElement;

	constructor(
		data: ClassificationData, config: InteractionConfig, assets: NormalizedAssets | null
	) {
		super(data, config, assets);

		this.data.categories.forEach(({label, items}) => {
			this.categories.push(label);
			this.allItems.push(...items);
		});

		this.currentCategory = this.categories[0];

		if (this.data.distractors) {
			this.allItems.push(...this.data.distractors);
		}

		this.allItems = shuffle(this.allItems);

		this.categorized = new Map<string, string>();
		this.initializeProgress(this.allItems.length);
	}

	protected initialize(): void {}
	protected cleanup(): void {}

	onVariantChange(newVariant: Variant): void {
		this.querySelectorAll('edu-chip, edu-block').forEach((el: EduChip | EduBlock) => {
			if (el.variant !== undefined) {
				el.variant = newVariant;
			}
		});
	}

	// ==================== RENDERING ====================

	render(): void {
		this.innerHTML = `
			<style>
				open-classification {
					--current-color: #94a3b8;
					display: flex;
					width: 100%;
					height: 100%;
					box-sizing: border-box;
					container-type: size;
					container-name: open-classification;
				}

				.container {
					display: flex;
					flex-direction: column;
					width: 100%;
					height: 100%;
					gap: clamp(0.5rem, min(1.6cqw, 1.6cqh), 1rem);
					padding: clamp(0.75rem, min(2cqw, 2cqh), 1.5rem);
					box-sizing: border-box;
					overflow: hidden;
				}

				@container open-classification (max-width: 768px) {
					.container {
						padding: clamp(0.75rem, min(1.6cqw, 1.6cqh), 1rem);
					}
				}

				.items-section {
					flex: 1;
					display: flex;
					flex-direction: column;
					gap: clamp(0.25rem, min(1cqw, 1cqh), 0.5rem);
					min-height: 0;
					overflow: hidden;
				}

				.items-label {
					font-size: clamp(0.8rem, 1.8cqh, 1rem);
					font-weight: 600;
					color: rgb(var(--edu-second-ink));
					flex-shrink: 0;
				}

				.items-container {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
					grid-auto-rows: minmax(44px, 1fr);
					gap: clamp(0.5rem, min(1.6cqw, 1.6cqh), 1rem);
					padding: clamp(0.5rem, min(1.6cqw, 1.6cqh), 1.25rem);
					background: rgb(var(--edu-muted));
					border-radius: clamp(6px, 1.6cqw, 8px);
					flex: 1;
					overflow-y: auto;
					overflow-x: hidden;
					align-content: stretch;
					min-height: 0;
				}

				.items-container edu-chip {
					width: 100%;
					height: 100%;
					cursor: pointer;
					transition: transform 0.2s ease, box-shadow 0.2s ease;
				}

				.items-container edu-chip:hover {
					transform: translateY(-3px);
					box-shadow: 0 6px 16px rgba(var(--edu-shadow-color), 0.15);
				}

				.items-container edu-chip::part(block) {
					width: 100%;
					height: 100%;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				@container open-classification (max-width: 1024px) {
					.items-container {
						grid-template-columns: repeat(auto-fit, minmax(min(100%, 140px), 1fr));
						gap: clamp(0.5rem, min(1.4cqw, 1.4cqh), 0.875rem);
					}
				}

				@container open-classification (max-width: 768px) {
					.items-container {
						grid-template-columns: repeat(auto-fit, minmax(min(100%, 120px), 1fr));
						padding: clamp(0.5rem, min(1.2cqw, 1.2cqh), 1rem);
						gap: clamp(0.5rem, min(1.2cqw, 1.2cqh), 0.75rem);
					}
				}

				@container open-classification (max-width: 560px) {
					.items-container {
						grid-template-columns: repeat(auto-fit, minmax(min(100%, 110px), 1fr));
					}
				}

				.divider {
					border: none;
					border-top: 1px solid rgb(var(--edu-border));
					margin: 0;
					flex-shrink: 0;
				}

				.swatch-section {
					flex-shrink: 0;
					display: flex;
					flex-direction: column;
					gap: clamp(0.25rem, min(1cqw, 1cqh), 0.5rem);
				}

				.swatch-label {
					font-size: clamp(0.8rem, 1.8cqh, 1rem);
					font-weight: 600;
					color: rgb(var(--edu-second-ink));
					flex-shrink: 0;
				}

				.categories-bar {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(min(100%, 110px), 1fr));
					gap: clamp(0.4rem, min(1.2cqw, 1.2cqh), 0.75rem);
				}

				#categories-bar edu-block::part(block) {
					padding: clamp(0.35rem, min(1cqw, 1cqh), 0.6rem);
					font-size: clamp(0.75rem, 1.6cqh, 0.95rem);
					min-height: clamp(44px, 8cqh, 64px);
				}

				#categories-bar edu-block.active::part(block) {
					background: var(--category-color);
					border-color: var(--category-color);
					color: rgb(var(--edu-inverted-ink));
					box-shadow: 0 0 0 3px rgb(var(--edu-first-accent) / 0.2);
				}
			</style>

			<div class="container">
				<div class="items-section">
					<!--Sacrificing label for space-->
					<div class="items-container"></div>
				</div>

				<hr class="divider">

				<div class="swatch-section">
					<div class="swatch-label">Categories</div>
				</div>

				<div class="categories-bar" id="categories-bar">
					<!-- Categories populated dynamically -->
				</div>
			</div>
		`;

		this.style.setProperty('--current-color', this.currentColor);

		this.$categoriesBar = this.querySelector("#categories-bar") as HTMLDivElement;
		this.setCategories(this.$categoriesBar);

		const itemsContainer = this.querySelector(".items-container") as HTMLDivElement;
		this.setItems(itemsContainer);
	}

	private setItems(container: HTMLDivElement): void {
		this.allItems.forEach((item, i) => {
			const chip = document.createElement("edu-chip") as EduChip;
			chip.variant = this.config.variant;
			// chip.prefix = `${i+1}:`;
			chip.dataset.label = item;

			setUpChipData(item, chip, this.assets?.assetsById);

			chip.addEventListener("click", (e) => {
				const chip = e.currentTarget as EduChip;
				const label = chip.dataset.label!;

				if (this.categorized.get(label) === this.currentCategory) {
					this.categorized.delete(label);
					chip.colored = false;
					this.decrementProgress();
					this.emitStateChange();
					return;
				}

				if (!this.categorized.has(label)) {
					this.incrementProgress();
				}

				this.categorized.set(label, this.currentCategory);
				chip.color = this.currentColor;
				chip.colored = true;
				this.emitStateChange();
			});

			container.append(chip);
		});
	}

	private setCategories(container: HTMLDivElement): void {
		this.categories.forEach((cat, i) => {
			const categoryBlock = new EduBlock();
			categoryBlock.variant = this.config.variant;

			const color = this.categoryColors[i % this.categoryColors.length];

			categoryBlock.dataset.category = cat;
			categoryBlock.dataset.color = color;
			categoryBlock.style.setProperty('--category-color', color);
			categoryBlock.innerHTML = `
				<div class="category-label">${cat}</div>
			`;

			categoryBlock.addEventListener("click", (e) => {
				const block = e.currentTarget as HTMLElement;
				this.currentCategory = block.dataset.category!;
				this.currentColor = block.dataset.color!;

				this.style.setProperty('--current-color', this.currentColor);
				container.querySelectorAll('edu-block').forEach((el) => el.classList.remove('active'));
				categoryBlock.classList.add('active');
			});

			if (cat === this.currentCategory) {
				categoryBlock.classList.add('active');
			}

			container.append(categoryBlock);
		});
	}

	// ==================== INTERACTION LOGIC ====================

	getCurrentState(): any {
		return {
			categorized: Object.fromEntries(this.categorized),
			progress: this.progressTracker.current
		};
	}

	isInteractionComplete(): boolean {
		if (this.categorized.size !== this.allItems.length) {
			return false;
		}

		for (const value of this.categorized.values()) {
			if (value === null || value === undefined) {
				return false;
			}
		}

		return true;
	}

	onHint(): void {
		const uncategorized = this.allItems.filter(item => !this.categorized.has(item));

		if (uncategorized.length === 0) {
			alert('All items are categorized! Click "Check" to submit.');
			this.emitHintShown('All items categorized');
			return;
		}

		const firstUncategorized = uncategorized[0];
		alert(`Hint: You haven't categorized "${firstUncategorized}" yet. Which category does it belong to?`);
		this.emitHintShown(`Uncategorized item: ${firstUncategorized}`);
	}

	// ==================== GRADING ====================

	public submit(): void {
		super.submit();
		const result = classificationGrader(this.data.categories, this.categorized, this);
		
		console.log(`Classification Score: ${result.score.toFixed(1)}% (${result.correct}/${result.total} correct)`);

		this.dispatchEvent(new CustomEvent('interaction:graded', {
			detail: { result },
			bubbles: true,
			composed: true
		}));

		this.setAttribute("inert", "");
	}

	// ==================== RESET ====================

	public reset(): void {
		super.reset();
		this.categorized.clear();

		this.querySelectorAll('edu-chip').forEach((chip: any) => {
			chip.classList.remove('colorized');
			chip.style.setProperty('--current-color', '');
		});
	}
}

// Register as custom element
if (!customElements.get('open-classification')) {
	customElements.define('open-classification', OpenClassification);
}
