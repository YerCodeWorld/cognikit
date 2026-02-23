import { BaseInteraction } from "../../../core/BaseInteraction";
import { Variant } from "../../../shared/types";
import { InteractionConfig, InteractionMechanic } from "../../../types/Interactions";
import {
	TextEngineBlanksData,
	TextEngineBlanksDataTarget
} from "../../../types/Text";
import {
	EduText,
	textEngineBlanksGrader,
	getBlanksGradingState,
	type TextEngineBlanksUserData
} from "../../../engines/text";

export class FillBlanks extends BaseInteraction<TextEngineBlanksData> {

	interactionMechanic: InteractionMechanic = "static";

	private _textConfig: { data: TextEngineBlanksData; mode: "blanks"; variant: Variant; };
	private _$text!: EduText;

	constructor(data: TextEngineBlanksData, config: InteractionConfig) {
		super(data, config);

		this._textConfig = {
			data,
			mode: "blanks",
			variant: config.variant ?? "outline"
		};

		this.initializeProgress(data.targets.length);
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
			this.updateProgressBasedOnInputs();
			this.emitStateChange();
		});

		this.innerHTML = `
			<style>
				fill-blanks {
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

	private updateProgressBasedOnInputs() {
		const userData = this.getCurrentState();
		const values = userData.inputValues ?? {};
		const answered = this.data.targets.filter((target) => {
			const value = values[target.id];
			return value !== undefined && value !== null && String(value).trim() !== "";
		}).length;

		this.setProgress(answered);
	}

	getCurrentState(): TextEngineBlanksUserData {
		if (!this._$text) return { inputValues: {} };
		return this._$text.getValue();
	}

	isInteractionComplete(): boolean {
		return this.getProgress().current === this.getProgress().total;
	}

	onHint(): void {
		const userData = this.getCurrentState();
		const values = userData.inputValues ?? {};
		const firstMissed = this.data.targets.find((target) => {
			const value = values[target.id];
			return value === undefined || value === null || String(value).trim() === "";
		});

		if (!firstMissed) {
			this.emitHintShown("All blanks are filled. Submit to check answers.");
			return;
		}

		this.emitHintShown(this.getHintText(firstMissed));
	}

	private getHintText(target: TextEngineBlanksDataTarget): string {
		switch (target.expectedValue.type) {
			case "text":
				return "Fill the missing text blank.";
			case "number":
				return "Fill the numeric blank.";
			case "select":
				return "Choose the right option in the select blank.";
			case "date":
				return "Fill the date blank in the expected format.";
			case "time":
				return "Fill the time blank in the expected format.";
			default:
				return "Complete the next blank.";
		}
	}

	grade() {
		const userData = this.getCurrentState();
		const result = textEngineBlanksGrader(this.data, userData);
		const gradingState = getBlanksGradingState(this.data, userData);

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

if (!customElements.get("fill-blanks")) {
	customElements.define("fill-blanks", FillBlanks);
}
