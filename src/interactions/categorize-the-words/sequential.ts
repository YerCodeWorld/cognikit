import { BaseInteraction } from "../../core/BaseInteraction";
import { Variant } from "../../shared/types";
import { InteractionConfig, InteractionMechanic } from "../../types/Interactions";
import { GradingResult } from "../../types/Grading";
import { TextEngineClassificationData, TextEngineConfiguration, TextEngineSequentialInteractionData } from "../../types/Text";

import {
	EduText,
	textEngineClassificationGrader,
	getClassificationGradingState,
	type TextEngineClassificationUserData,
	type TextEngineClassificationGradingState
} from "../../engines/text";

export class SequentialCategorizeTheWords extends BaseInteraction<TextEngineSequentialInteractionData> {

	interactionMechanic: InteractionMechanic = "sequential";

	private _slides: TextEngineClassificationData[] = [];
	private _currentStep = 0;

	private _textConfig!: TextEngineConfiguration;
	private _$text!: EduText;

	private _responses: Record<number, TextEngineClassificationUserData> = {};
	private _gradingByStep: Record<number, TextEngineClassificationGradingState> = {};
	private _isGraded = false;

	public get slidesCount(): number {
		return this._slides.length;
	}

	constructor(data: TextEngineSequentialInteractionData, config: InteractionConfig) {
		super(data, config);

		this._slides = (Array.isArray(data) ? data : []).filter(
			(slide): slide is TextEngineClassificationData => slide.type === "classification"
		);

		if (this._slides.length === 0) {
			this.isValid = false;
			this.errors = "SequentialCategorizeTheWords requires at least one classification slide.";
			return;
		}

		this._textConfig = {
			data: this._slides[0],
			mode: "classification",
			variant: config.variant ?? "outline"
		};

		this.initializeProgress(this.getTotalTargetCount());
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

	public setSteps(stepIndex: number): void {
		this.saveCurrentStepResponse();

		const nextStep = Math.max(0, Math.min(this._slides.length - 1, stepIndex - 1));
		if (nextStep === this._currentStep) return;

		this._currentStep = nextStep;
		this.render();
	}

	render(): void {
		if (this._slides.length === 0) return;

		this._textConfig = {
			data: this._slides[this._currentStep],
			mode: "classification",
			variant: this.config.variant
		};

		this._$text = document.createElement("edu-text") as EduText;
		this._$text.config = this._textConfig;

		const stepState = this._responses[this._currentStep];
		if (stepState?.wordCategories) {
			this._$text.setState({ wordCategories: stepState.wordCategories });
		}

		const stepGrading = this._gradingByStep[this._currentStep];
		if (this._isGraded && stepGrading) {
			this._$text.setGradingState(stepGrading);
		}

		this._$text.addEventListener("change", () => {
			this.saveCurrentStepResponse();
			this.updateProgressAcrossSteps();
			if (this._isGraded) {
				delete this._gradingByStep[this._currentStep];
				this._$text.clearGradingState();
			}
			this.emitStateChange();
		});

		this.innerHTML = `
			<style>
				sequential-categorize-the-words {
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

	private getTargetIndices(slide: TextEngineClassificationData): Set<number> {
		const indices = new Set<number>();
		for (const category of slide.targets) {
			for (const target of category.targets) {
				for (let i = target.startPos; i <= target.endPos; i++) {
					indices.add(i);
				}
			}
		}
		return indices;
	}

	private getTotalTargetCount(): number {
		return this._slides.reduce((sum, slide) => sum + this.getTargetIndices(slide).size, 0);
	}

	private saveCurrentStepResponse(): void {
		if (!this._$text) return;
		this._responses[this._currentStep] = this._$text.getValue();
	}

	private getResponseForStep(step: number): TextEngineClassificationUserData {
		return this._responses[step] ?? { wordCategories: {} };
	}

	private updateProgressAcrossSteps(): void {
		let answered = 0;

		for (let i = 0; i < this._slides.length; i++) {
			const slide = this._slides[i];
			const response = this.getResponseForStep(i);
			const targetIndices = this.getTargetIndices(slide);

			for (const idx of targetIndices) {
				if (response.wordCategories[idx]) answered++;
			}
		}

		this.setProgress(answered);
	}

	getCurrentState(): any {
		this.saveCurrentStepResponse();
		return {
			step: this._currentStep,
			responses: this._responses
		};
	}

	isInteractionComplete(): boolean {
		return this.getProgress().current === this.getProgress().total;
	}

	onHint(): void {
		this.saveCurrentStepResponse();

		const slide = this._slides[this._currentStep];
		const response = this.getResponseForStep(this._currentStep);
		const targetIndices = this.getTargetIndices(slide);

		for (const idx of targetIndices) {
			if (!response.wordCategories[idx]) {
				this.emitHintShown(`Try categorizing "${slide.parts[idx]}"`);
				return;
			}
		}

		this.emitHintShown("This step is complete. Move to another step or submit.");
	}

	grade(): GradingResult {
		this.saveCurrentStepResponse();

		let correct = 0;
		let total = 0;
		const gradingByStep: Record<number, TextEngineClassificationGradingState> = {};

		for (let i = 0; i < this._slides.length; i++) {
			const slide = this._slides[i];
			const response = this.getResponseForStep(i);
			const result = textEngineClassificationGrader(slide, response);

			correct += result.correct;
			total += result.total;
			gradingByStep[i] = getClassificationGradingState(slide, response);
		}

		this._gradingByStep = gradingByStep;
		this._isGraded = true;

		const currentGrading = this._gradingByStep[this._currentStep];
		if (currentGrading) {
			this._$text.setGradingState(currentGrading);
		}

		const score = total > 0 ? Math.round((correct / total) * 100) : 0;
		return { score, correct, total };
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
		this._responses = {};
		this._gradingByStep = {};
		this._isGraded = false;
		this._currentStep = 0;
		if (this._$text) {
			this._$text.reset();
			this._$text.clearGradingState();
		}
		this.setProgress(0);
		this.render();
	}
}

if (!customElements.get("sequential-categorize-the-words")) {
	customElements.define("sequential-categorize-the-words", SequentialCategorizeTheWords);
}
