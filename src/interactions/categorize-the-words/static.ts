import { BaseInteraction } from "../../core/BaseInteraction";
import { Variant } from "../../shared/types";
import { InteractionConfig, InteractionMechanic } from "../../types/Interactions";
import { TextEngineClassificationData, TextEngineConfiguration } from "../../types/Text";

import {
	EduText,
	textEngineClassificationGrader,
	getClassificationGradingState,
	type TextEngineClassificationUserData
} from "../../engines/text";

export class CategorizeTheWords extends BaseInteraction<TextEngineClassificationData> {

	interactionMechanic: InteractionMechanic = "static";

	private _textConfig: TextEngineConfiguration;
	private _$text!: EduText;

	constructor(data: TextEngineClassificationData, config: InteractionConfig) {
		super(data, config);

		this._textConfig = {
			data,
			mode: "classification",
			variant: config.variant ?? "outline"
		};

		this.implementsProgress = false;
	}

	protected initialize(): void {}
	protected cleanup(): void {}

	onVariantChange(newVariant: Variant): void {
		this.config.variant = newVariant;
		this._textConfig.variant = newVariant;
		if (this._$text) {
			this._$text.setAttribute("variant", newVariant);
		}
	}

	render(): void {
		this._textConfig.variant = this.config.variant;

		this._$text = document.createElement("edu-text") as EduText;
		this._$text.config = this._textConfig;

		this._$text.addEventListener("change", () => {
			this.emitStateChange();
		});

		this.innerHTML = `
			<style>
				categorize-the-words {
					display: flex;
					width: 100%;
					height: 100%;
					box-sizing: border-box;
				}

				.text-container {
					display: flex;
					flex-direction: column;
					width: 100%;
					height: 100%;
					overflow: hidden;
					box-sizing: border-box;
				}

				.text-wrapper {
					flex: 1;
					overflow-y: auto;
					overflow-x: auto;
					min-height: 0;
					padding: 1rem;
				}
			</style>
			<div class="text-container">
				<div class="text-wrapper"></div>
			</div>
		`;

		const wrapper = this.querySelector(".text-wrapper") as HTMLDivElement;
		wrapper.appendChild(this._$text);
	}

	private getTargetIndices(): Set<number> {
		const indices = new Set<number>();
		for (const category of this.data.targets) {
			for (const target of category.targets) {
				for (let i = target.startPos; i <= target.endPos; i++) {
					indices.add(i);
				}
			}
		}
		return indices;
	}

	getCurrentState(): TextEngineClassificationUserData {
		if (!this._$text) return { wordCategories: {} };
		return this._$text.getValue();
	}

	isInteractionComplete(): boolean {
		const userData = this.getCurrentState();
		const targetIndices = this.getTargetIndices();
		for (const idx of targetIndices) {
			if (!userData.wordCategories[idx]) return false;
		}
		return true;
	}

	onHint(): void {
		const userData = this.getCurrentState();

		for (const category of this.data.targets) {
			for (const target of category.targets) {
				for (let i = target.startPos; i <= target.endPos; i++) {
					if (!userData.wordCategories[i]) {
						this.emitHintShown(`Try categorizing "${this.data.parts[i]}"`);
						return;
					}
				}
			}
		}

		this.emitHintShown("All target words are categorized.");
	}

	grade() {
		const userData = this.getCurrentState();
		const result = textEngineClassificationGrader(this.data, userData);
		const gradingState = getClassificationGradingState(this.data, userData);

		if (this._$text) {
			this._$text.setGradingState(gradingState);
		}

		return result;
	}

	public submit(): void {
		super.submit();
		const result = this.grade();
		this.dispatchEvent(new CustomEvent("interaction:graded", {
			detail: { result },
			bubbles: true,
			composed: true
		}));
	}

	public reset(): void {
		super.reset();
		if (this._$text) {
			this._$text.reset();
			this._$text.clearGradingState();
		}
	}
}

if (!customElements.get("categorize-the-words")) {
	customElements.define("categorize-the-words", CategorizeTheWords);
}
