import { BaseInteraction } from "../../../core";
import { ClassificationData } from "../../../shared";

export class ClassificationInteraction extends BaseInteraction<ClassificationData> {
	
	private root: HTMLElement;
	
	render(): void {
		root = document.createElement("edu-window");

	}
	
}
