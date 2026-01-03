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
	private $categoriesDlg!: HTMLDialogElement;
	private $categorySwatch!: EduBlock;
	private $swatchLabel!: HTMLElement;
	private $swatchColor!: HTMLSpanElement;

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
				:host {
					--current-color: #94a3b8;
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
					padding: 1rem;
					box-sizing: border-box;
					overflow: hidden;
				}

				.items-container {
					display: flex;
					flex-wrap: wrap;
					gap: 0.9rem;
					padding: 1rem;
					background: rgb(var(--edu-muted));
					border-radius: 8px;
					flex: 1;
					overflow-y: auto;
					overflow-x: hidden;
					align-content: flex-start;
					min-height: 0;
				}
				
				edu-chip {
					
				}

				.divider {
					border: none;
					border-top: 1px solid rgb(var(--edu-border));
					margin: 0;
					flex-shrink: 0;
				}

				#category-swatch-container {
					padding: 0 20% 0 20%;
					flex-shrink: 0;
				}

				.swatch-content {
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 0.75rem;
				}

				.swatch-label {
					font-size: 1rem;
					font-weight: 600;
				}

				.swatch-color {
					width: 24px;
					height: 24px;
					background-color: var(--current-color);
					border-radius: 50%;
					border: 2px solid rgb(var(--edu-inverted-ink));
					box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
				}

				/* Dialog Styles */
				dialog {
					background: rgb(var(--edu-card));
					border: 2px solid rgb(var(--edu-border));
					color: rgb(var(--edu-ink));
					border-radius: 12px;
					padding: 1.5rem;
					box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
					max-width: 500px;
				}

				dialog::backdrop {
					background: rgba(0, 0, 0, 0.5);
					backdrop-filter: blur(4px);
				}

				dialog .categories-container {
					display: grid;
					grid-template-columns: repeat(2, 1fr);
					gap: 0.75rem;
					margin-bottom: 1rem;
				}

				dialog .category {
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 0.5rem;
					background: none;
					cursor: pointer;
					transition: all 0.2s ease;
				}

				dialog .category:hover {
					border-color: rgb(var(--edu-first-accent));
					transform: translateY(-2px);
					box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
				}

				dialog .category-label {
					font-size: 0.9rem;
					font-weight: 600;
					color: rgb(var(--edu-ink));
					text-align: center;
				}

				dialog .category-color {
					width: 100%;
					height: 40px;
					border-radius: 6px;
					border: 2px solid rgba(0, 0, 0, 0.1);
				}
			</style>

			<div class="container">
				<div class="items-container"></div>

				<hr class="divider">
				<div id="category-swatch-container"></div>
			</div>

			<dialog id="dlg">
				<div class="categories-container">
					<!-- Categories populated dynamically -->
				</div>
				<footer>
					<label>Select a category to classify items</label>
				</footer>
			</dialog>
		`;

		this.style.setProperty('--current-color', this.currentColor);

		this.$categoriesDlg = this.querySelector("#dlg") as HTMLDialogElement;
		this.setCategories(this.$categoriesDlg);

		const swatchContainer = this.querySelector("#category-swatch-container") as HTMLDivElement;
		this.setSwatch(swatchContainer);

		const itemsContainer = this.querySelector(".items-container") as HTMLDivElement;
		this.setItems(itemsContainer);
	}

	private setItems(container: HTMLDivElement): void {
		this.allItems.forEach((item, i) => {
			const chip = document.createElement("edu-chip") as EduChip;
			chip.variant = this.config.variant;
			chip.prefix = `${i+1}:`;
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

	private setSwatch(container: HTMLDivElement): void {
		this.$categorySwatch = new EduBlock;
		this.$categorySwatch.variant = this.config.variant;
		this.$categorySwatch.innerHTML = `
			<div class="swatch-content">
				<span class="swatch-label">Choose a Category</span>
				<span class="swatch-color"></span>
			</div>
		`;

		this.$categorySwatch.addEventListener("click", () => {
			this.$categoriesDlg.showModal();
		});

		container.appendChild(this.$categorySwatch);

		this.$swatchLabel = this.$categorySwatch.querySelector('.swatch-label')!;
		this.$swatchColor = this.$categorySwatch.querySelector('.swatch-color')!;
		this.updateSwatch();
	}

	private updateSwatch(): void {
		this.$swatchLabel.textContent = this.currentCategory;
		this.$swatchColor.style.backgroundColor = this.currentColor;
	}

	private setCategories(dialog: HTMLDialogElement): void {
		const dlgContent = dialog.querySelector(".categories-container")!;
		this.categories.forEach((cat, i) => {
			const categoryBlock = new EduBlock();
			categoryBlock.variant = this.config.variant;

			const color = this.categoryColors[i % this.categoryColors.length];

			categoryBlock.dataset.category = cat;
			categoryBlock.dataset.color = color;
			categoryBlock.innerHTML = `
				<div class="category-label">${cat}</div>
				<div class="category-color" style="background-color: ${color}"></div>
			`;

			categoryBlock.addEventListener("click", (e) => {
				const block = e.currentTarget as HTMLElement;
				this.currentCategory = block.dataset.category!;
				this.currentColor = block.dataset.color!;

				this.style.setProperty('--current-color', this.currentColor);
				this.updateSwatch();
				this.$categoriesDlg.close();
			});

			dlgContent.append(categoryBlock);
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
