import { BaseInteraction } from "../../../core";
import { ClassificationData, InteractionOptions } from "../../../shared";

export class ClassificationMatrix extends BaseInteraction<ClassificationData> {
	
	private categories: string[];
	private allItems: string[]; 

	// we only need a map 'categorized'for <item and assigned category>
	// alreadyCategorized = Object.keys(categorized).length
	private categorized: Map<string, string> = new Map();

	constructor(options: InteractionOptions<ClassificationData>) {

		super(options);

		this.data.categories.forEach(({label, items}) => {
			this.categories.push(label);
			this.allItems.push(...items);
		});
		
		if (this.data.distractors) {
			this.allItems.push(...this.data.distractors);
		}

		this.initializeProgress(this.allItems.length);

	}

	// runs automatically 
	render(): void {
		
		
	
	}

	getCurrentState(): any {
		
	}

	isInteractionComplete(): boolean {
		return this.allItems.length === this.categorized.size;
	}

	submitForScoring(): void {}

}

