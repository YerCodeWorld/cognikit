import { BaseInteraction } from "../../../core";
import { EduChip, EduBlock } from "../../../ui";
import { ClassificationData, InteractionOptions } from "../../../shared";
import { shuffle } from "../../../shared";
import { classificationGrading } from "../implementation";

export class OpenClassification extends BaseInteraction<ClassificationData> { 

	private categories: string[] = ["none"]; 
	private allItems: string[] = []; 

	// for the dialog and the categorized state
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
	]

	// more state-like
	private categorized: Map<string, string>;
	private currentCategory: string;
	private currentColor: string = this.categoryColors[0];
	
	// els 
	private $categoriesDlg: HTMLDialogElement;
	private $categorySwatch: HTMLElement;
	private $swatchLabel: HTMLElement;
	private $swatchColor: HTMLSpanElement;

	constructor(options: InteractionOptions<ClassificationData>) {

		super(options);

		this.data.categories.forEach(({label, items}) => {
			this.categories.push(label);
			this.allItems.push(...items);
		});

		this.currentCategory = this.categories[0];
		
		if (this.data.distractors) {
			this.allItems.push(...this.data.distractors);
		}

		this.allItems = shuffle(this.allItems);

		this.categorized = new Map();
		this.initializeProgress(this.allItems.length);

	}

	render(): void {
		
		const content = this.getContentArea();
		content.innerHTML = `
			<style>
				:host {
					--current-color: #94a3b8;
				}

				.container {
					display: flex;
					flex-direction: column;
					gap: 1rem;
					padding: 1rem;
				}

				.items-container {
					display: flex;
					flex-wrap: wrap;
					gap: 0.5rem;
					padding: 1rem;
					background: rgb(var(--edu-muted));
					border-radius: 8px;
					min-height: 200px;
				}

				.divider {
					border: none;
					border-top: 1px solid rgb(var(--edu-border));
					margin: 0.5rem 0;
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

				/* Chip colorization */
				edu-chip.colorized {
					position: relative;
				}

				edu-chip.colorized::before {
					content: '';
					position: absolute;
					top: -2px;
					left: -2px;
					right: -2px;
					bottom: -2px;
					border-radius: 10px;
					border: 3px solid var(--current-color);
					background: var(--current-color);
					opacity: 0.2;
					pointer-events: none;
				}

			</style>

			<div class="container">
				<div class="items-container"></div>

				<hr class="divider">
			<!-- just a place holder -->
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
		
		content.style.setProperty('--current-color', this.currentColor);

		// categories
		this.$categoriesDlg = content.querySelector("#dlg");
		this.setCategories(this.$categoriesDlg, content);

		// swatch
		const swatchContainer = content.querySelector("#category-swatch-container");
		this.setSwatch(swatchContainer);

		// items
		const itemsContainer = content.querySelector(".items-container");
		this.setItems(itemsContainer, content);	
	}

	private setItems(container: HTMLDivElement, root: HTMLElement): void {
		this.allItems.forEach((item, i) => {

			// asuming we are sure the custom element exists
			const chip = document.createElement("edu-chip") as EduChip;
			chip.variant =	this.config.variant; 
			chip.textContent = item;
			chip.dataset.label = item;
			chip.id = `chip-00${i}`; // no idea if this is necessary but ok 
			
			// all this s* just to recolor the chip with the original color in case it rerenders
			if (this.categorized.get(chip.dataset.label)) {
				const category = this.categorized.get(chip.dataset.label);
				const index = this.categories.indexOf(category);
				const color = this.categoryColors[index];
				chip.style.setProperty('--current-color', color);
				chip.classList.add('colorized');
			}

			chip.addEventListener("click", (e) => {
				const chip = e.currentTarget as EduChip;
				const label = chip.dataset.label;

				// Toggle if clicking same category
				if (this.categorized.get(label) === this.currentCategory) {
					this.categorized.delete(label);
					chip.classList.remove('colorized');
					chip.style.setProperty('--current-color', '');
					this.decrementProgress();
					return;
				}

				// Track progress only for new items
				if (!this.categorized.has(label)) {
					this.incrementProgress();
				}

				// Set the category
				this.categorized.set(label, this.currentCategory);
				chip.classList.add('colorized');
				chip.style.setProperty('--current-color', this.currentColor);
			});

			container.append(chip);
		});
	}

	private setSwatch(container: HTMLDivElement): void {
		this.$categorySwatch = document.createElement("edu-block");
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

		this.$swatchLabel = this.$categorySwatch.querySelector('.swatch-label');
		this.$swatchColor = this.$categorySwatch.querySelector('.swatch-color');
		this.updateSwatch();
	}

	private updateSwatch(): void {
		this.$swatchLabel.textContent = this.currentCategory;
		this.$swatchColor.style.backgroundColor = this.currentColor;
	}

	private setCategories(dialog: HTMLDialogElement, root: HTMLElement): void {
		const dlgContent = dialog.querySelector(".categories-container");
		this.categories.forEach((cat, i) => {
			const categoryBlock = document.createElement("edu-block");
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
				this.currentCategory = block.dataset.category;
				this.currentColor = block.dataset.color;

				root.style.setProperty('--current-color', this.currentColor);
				this.updateSwatch();
				this.$categoriesDlg.close();
			});

			dlgContent.append(categoryBlock);
		});
	}

	getCurrentState(): any {
		return {
			categorized: Object.fromEntries(this.categorized),
			progress: this.getProgress()
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

	submitForScoring(): void {
		const score = classificationGrading(this.data.categories, this.categorized);
		console.log(`Score: ${score.score.toFixed(1)}% (${score.correct}/${score.total})`);

		this.disableCheckButton();
		this.shell.setAttribute("inert", "");
		super.submitForScoring();
	}

}

