import { BaseInteraction } from "../../../core";
import { ClassificationData, InteractionOptions } from "../../../shared";

export class SequentialClassification extends BaseInteraction<ClassificationData> {
	
	private categories: string[];
	private allItems: string[]; 
	private currentItem: number = 0;

	private categorized: Map<string, string> = new Map();

	private $catContainer: HTMLDivElement;
	private $itemsContainer: HTMLDivElement;

	constructor(options: InteractionOptions<ClassificationData>) {

		super(options);

		this.data.categories.forEach(({label, items}) => {
			this.categories.push(label);
			this.allItems.push(...items);
		});
		
		if (this.data.distractors) {
			this.allItems.push(...this.data.distractors);
		}

		this.setNavigationSteps(this.allItems.length);
		this.initializeProgress(this.allItems.length);
	}

	// runs automatically 
	render(): void {
		
		const content = this.getContentArea();	

		content.innerHTML = `
			<style>
				.wrap {}
				.items-container {}
				.categories-container {}
			</style>
			<div class="wrap">				
				<div class="items-container" id="items"></div>
				<div class="categories-container" id="categories"></div>
			</div>
		`; 

		this.$catContainer = content.querySelector(".categories-container");
		this.$itemsContainer = content.querySelector(".items-container");

		this.update();
	}

	private update(): void {
		this.$itemsContainer.textContent = this.allItems[this.currentItem];
	}

	onNavigationChange(stepIndex: number): void {
		this.currentItem = stepIndex;
		this.$itemsContainer.textContent = this.allItems[this.currentItem];
	}

	getCurrentState(): any {}

	isInteractionComplete(): boolean {
		return this.allItems.length === this.categorized.size;
	}

	submitForScoring(): void {}

}

