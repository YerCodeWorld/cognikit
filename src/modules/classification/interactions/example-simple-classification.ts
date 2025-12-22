import { BaseInteraction } from "../../../core";
import { ClassificationData, InteractionOptions } from "../../../shared";

/**
 * Example: Simple Classification Interaction
 *
 * This demonstrates how to use the BaseInteraction class
 * to create a fully-functional interaction.
 */
export class SimpleClassification extends BaseInteraction<ClassificationData> {

	private selectedCategories: Map<string, string> = new Map();
	private allItems: string[] = [];

	constructor(options: InteractionOptions<ClassificationData>) {
		super(options);

		// Calculate all items for progress tracking
		this.data.categories.forEach(cat => {
			this.allItems.push(...cat.items);
		});

		if (this.data.distractors) {
			this.allItems.push(...this.data.distractors);
		}

		// Initialize progress with total items to categorize
		this.initializeProgress(this.allItems.length);

		// Note: render() is called automatically by BaseInteraction
	}

	render(): void {
		const content = this.getContentArea();

		// Create categories
		const categoriesHTML = this.data.categories.map(cat => `
			<div class="category" data-category="${cat.label}">
				<h3>${cat.label}</h3>
				<div class="drop-zone" data-category="${cat.label}"></div>
			</div>
		`).join('');

		// Create items pool
		const itemsHTML = this.allItems.map(item => `
			<div class="item" draggable="true" data-item="${item}">
				${item}
			</div>
		`).join('');

		content.innerHTML = `
			<style>
				.classification-container {
					display: flex;
					gap: 1rem;
					flex-wrap: wrap;
				}
				.category {
					flex: 1;
					min-width: 200px;
					border: 2px solid rgb(var(--edu-border));
					border-radius: 8px;
					padding: 1rem;
				}
				.category h3 {
					margin-bottom: 0.5rem;
					color: rgb(var(--edu-first-accent));
				}
				.drop-zone {
					min-height: 150px;
					padding: 0.5rem;
					background: rgb(var(--edu-muted));
					border-radius: 4px;
				}
				.items-pool {
					display: flex;
					gap: 0.5rem;
					flex-wrap: wrap;
					padding: 1rem;
					background: rgb(var(--edu-bg));
					border-radius: 8px;
					margin-bottom: 1rem;
				}
				.item {
					padding: 0.5rem 1rem;
					background: white;
					border: 2px solid rgb(var(--edu-border));
					border-radius: 6px;
					cursor: grab;
					transition: all 0.2s;
				}
				.item:hover {
					border-color: rgb(var(--edu-first-accent));
					transform: translateY(-2px);
				}
				.item.placed {
					opacity: 0.5;
				}
			</style>

			<div class="items-pool" id="items-pool">
				${itemsHTML}
			</div>

			<div class="classification-container">
				${categoriesHTML}
			</div>
		`;

		this.setupDragAndDrop();
	}

	private setupDragAndDrop(): void {
		const content = this.getContentArea();
		let draggedItem: HTMLElement | null = null;

		// Drag start
		content.addEventListener('dragstart', (e) => {
			if ((e.target as HTMLElement).classList.contains('item')) {
				draggedItem = e.target as HTMLElement;
				(e.target as HTMLElement).style.opacity = '0.5';
			}
		});

		// Drag end
		content.addEventListener('dragend', (e) => {
			if ((e.target as HTMLElement).classList.contains('item')) {
				(e.target as HTMLElement).style.opacity = '1';
			}
		});

		// Drag over
		content.addEventListener('dragover', (e) => {
			e.preventDefault();
			const dropZone = (e.target as HTMLElement).closest('.drop-zone');
			if (dropZone) {
				dropZone.classList.add('drag-over');
			}
		});

		// Drag leave
		content.addEventListener('dragleave', (e) => {
			const dropZone = (e.target as HTMLElement).closest('.drop-zone');
			if (dropZone) {
				dropZone.classList.remove('drag-over');
			}
		});

		// Drop
		content.addEventListener('drop', (e) => {
			e.preventDefault();
			const dropZone = (e.target as HTMLElement).closest('.drop-zone') as HTMLElement;

			if (dropZone && draggedItem) {
				const category = dropZone.dataset.category!;
				const item = draggedItem.dataset.item!;

				// Add to category
				dropZone.appendChild(draggedItem);
				draggedItem.classList.add('placed');

				// Track selection
				this.selectedCategories.set(item, category);

				// Update progress
				this.incrementProgress();

				// Show check button when all items are placed
				if (this.selectedCategories.size === this.allItems.length) {
					this.showCheckButton();
				}

				draggedItem = null;
			}
		});
	}

	getCurrentState(): any {
		return {
			selections: Object.fromEntries(this.selectedCategories),
			progress: this.getProgress()
		};
	}

	isInteractionComplete(): boolean {
		return this.selectedCategories.size === this.allItems.length;
	}

	protected submitForScoring(): void {
		// Custom scoring logic
		let correctCount = 0;
		let totalCount = 0;

		this.data.categories.forEach(category => {
			category.items.forEach(correctItem => {
				totalCount++;
				const userCategory = this.selectedCategories.get(correctItem);
				if (userCategory === category.label) {
					correctCount++;
				}
			});
		});

		const score = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
		console.log(`Score: ${score.toFixed(1)}% (${correctCount}/${totalCount})`);

		// Disable further interaction
		this.disableCheckButton();
		this.shell.setAttribute("inert", "");

		// Call parent's submit
		super.submitForScoring();
	}
}
