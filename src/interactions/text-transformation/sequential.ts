import { BaseInteraction } from "../../core/BaseInteraction";
import { Variant } from "../../shared/types";
import { InteractionConfig, InteractionMechanic } from "../../types/Interactions";
import { GradingResult } from "../../types/Grading";
import { TextEngineBaseData, TextEngineConfiguration, TextEngineSequentialInteractionData } from "../../types/Text";

import {
	EduText,
	textEngineTransformationGrader,
	getTransformationGradingState,
	type TextEngineBaseUserData,
	type TextEngineBaseGradingState
} from "../../engines/text";

export type SequentialTransformationExpectations = Record<number, Record<number, string[]>>;

export class SequentialTextTransformation extends BaseInteraction<TextEngineSequentialInteractionData> {

	interactionMechanic: InteractionMechanic = "sequential";

	private _slides: TextEngineBaseData[] = [];
	private _currentStep = 0;

	private _textConfig!: TextEngineConfiguration;
	private _$text!: EduText;

	private _responses: Record<number, TextEngineBaseUserData> = {};
	private _gradingByStep: Record<number, TextEngineBaseGradingState> = {};
	private _isGraded = false;

	private _expectedByStep: SequentialTransformationExpectations = {};

	public get slidesCount(): number {
		return this._slides.length;
	}

	constructor(
		data: TextEngineSequentialInteractionData,
		config: InteractionConfig,
		expectedByStep?: SequentialTransformationExpectations
	) {
		super(data, config);

		this._slides = (Array.isArray(data) ? data : []).filter(
			(slide): slide is TextEngineBaseData => slide.type === "base"
		);

		if (this._slides.length === 0) {
			this.isValid = false;
			this.errors = "SequentialTextTransformation requires at least one base slide.";
			return;
		}

		this._textConfig = {
			data: this._slides[0],
			mode: "transformation",
			variant: config.variant ?? "outline"
		};

		this._expectedByStep = expectedByStep ?? this.buildDefaultExpectations();
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
			mode: "transformation",
			variant: this.config.variant
		};

		this._$text = document.createElement("edu-text") as EduText;
		this._$text.config = this._textConfig;

		const stepState = this._responses[this._currentStep];
		if (stepState?.transformations) {
			this._$text.setState({ transformations: stepState.transformations });
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
				sequential-text-transformation {
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

	private getTotalTargetCount(): number {
		return this._slides.reduce((sum, slide) => sum + slide.targets.length, 0);
	}

	private buildDefaultExpectations(): SequentialTransformationExpectations {
		const out: SequentialTransformationExpectations = {};

		for (let step = 0; step < this._slides.length; step++) {
			const slide = this._slides[step];
			out[step] = {};

			for (let i = 0; i < slide.targets.length; i++) {
				out[step][i] = slide.targets[i].words;
			}
		}

		return out;
	}

	private getExpectedForStep(step: number): Record<number, string[]> {
		return this._expectedByStep[step] ?? {};
	}

	private saveCurrentStepResponse(): void {
		if (!this._$text) return;
		this._responses[this._currentStep] = this._$text.getValue();
	}

	private getResponseForStep(step: number): TextEngineBaseUserData {
		return this._responses[step] ?? { transformations: {} };
	}

	private updateProgressAcrossSteps(): void {
		let answered = 0;

		for (let i = 0; i < this._slides.length; i++) {
			const slide = this._slides[i];
			const response = this.getResponseForStep(i);
			const transformations = response.transformations ?? {};

			answered += slide.targets.filter((_target, idx) => {
				const transformed = transformations[idx];
				return Array.isArray(transformed) && transformed.length > 0;
			}).length;
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
		const transformations = response.transformations ?? {};
		const expected = this.getExpectedForStep(this._currentStep);

		for (let i = 0; i < slide.targets.length; i++) {
			if (!transformations[i] || transformations[i].length === 0) {
				const originalWords = slide.targets[i].words.join(" ");
				const expectedWords = expected[i]?.join(" ") || originalWords;
				this.emitHintShown(`Transform "${originalWords}" to "${expectedWords}"`);
				return;
			}
		}

		this.emitHintShown("This step is complete. Move to another step or submit.");
	}

	grade(): GradingResult {
		this.saveCurrentStepResponse();

		let correct = 0;
		let total = 0;
		const gradingByStep: Record<number, TextEngineBaseGradingState> = {};

		for (let i = 0; i < this._slides.length; i++) {
			const slide = this._slides[i];
			const response = this.getResponseForStep(i);
			const expected = this.getExpectedForStep(i);

			const result = textEngineTransformationGrader(slide, response, expected);
			correct += result.correct;
			total += result.total;

			gradingByStep[i] = getTransformationGradingState(slide, response, expected);
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

	setExpectedTransformationsByStep(expectedByStep: SequentialTransformationExpectations): void {
		this._expectedByStep = expectedByStep;
	}
}

if (!customElements.get("sequential-text-transformation")) {
	customElements.define("sequential-text-transformation", SequentialTextTransformation);
}
