import { BaseInteraction } from "../../core/BaseInteraction";
import { Variant } from "../../shared/types";
import { InteractionConfig, InteractionMechanic } from "../../types/Interactions";
import { TextEngineBaseData, TextEngineConfiguration } from "../../types/Text";

import {
	EduText,
	textEngineTransformationGrader,
	type TextEngineBaseUserData
} from "../../engines/text";

/**
 * Text Transformation Interaction
 *
 * Users edit highlighted text segments to transform them according to instructions.
 * For example: convert present tense to past tense, singular to plural, etc.
 *
 * Example data:
 * ```
 * {
 *   type: 'base',
 *   parts: ['I', 'drink', 'water', 'every', 'day'],
 *   targets: [
 *     { words: ['drink'], startPos: 1, endPos: 1 }
 *   ]
 * }
 * ```
 *
 * Expected transformations would be provided separately in config or instructions.
 */
export class TextTransformation extends BaseInteraction<TextEngineBaseData> {

	interactionMechanic: InteractionMechanic = "static";

	private _textConfig: TextEngineConfiguration;
	private _$text!: EduText;
	private _expectedTransformations: Record<number, string[]>;

	constructor(
		data: TextEngineBaseData,
		config: InteractionConfig,
		expectedTransformations?: Record<number, string[]>
	) {
		super(data, config);

		// Store expected transformations
		// If not provided, use targets words as is (for testing/demo)
		this._expectedTransformations = expectedTransformations ?? {};

		// If no expected transformations provided, create default ones
		if (Object.keys(this._expectedTransformations).length === 0) {
			data.targets.forEach((target, index) => {
				// Default: expect the same words (no transformation required)
				// In real usage, this would be provided by the author
				this._expectedTransformations[index] = target.words;
			});
		}

		// Configure text engine for transformation mode
		this._textConfig = {
			data: data,
			mode: 'transformation',
			variant: config.variant ?? 'outline'
		};

		// Initialize progress tracking (one per target)
		this.initializeProgress(data.targets.length);
	}

	// ==================== LIFECYCLE ====================

	protected initialize(): void {}
	protected cleanup(): void {}

	onVariantChange(newVariant: Variant): void {
		this.config.variant = newVariant;
		this._textConfig.variant = newVariant;
		if (this._$text) {
			this._$text.setAttribute('variant', newVariant);
		}
	}

	// ==================== RENDERING ====================

	render(): void {
		// Update text config variant to match current
		this._textConfig.variant = this.config.variant;

		// Create text element
		this._$text = document.createElement('edu-text') as EduText;
		this._$text.config = this._textConfig;

		// Listen to text changes
		this._$text.addEventListener('change', () => {
			this.updateProgressBasedOnTransformations();
			this.emitStateChange();
		});

		// Render with wrapper for proper height/overflow handling
		this.innerHTML = `
			<style>
				edu-text {
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

		const wrapper = this.querySelector('.text-wrapper') as HTMLDivElement;
		wrapper.appendChild(this._$text);
	}

	// ==================== INTERACTION LOGIC ====================

	/**
	 * Update progress bar based on how many transformations have been made
	 */
	private updateProgressBasedOnTransformations() {
		const userData = this._$text.getValue() as TextEngineBaseUserData;
		const transformations = userData.transformations ?? {};

		// Count how many targets have been edited
		const editedCount = Object.keys(transformations).filter(key => {
			const transformed = transformations[parseInt(key)];
			return transformed && transformed.length > 0;
		}).length;

		this.setProgress(editedCount);
	}

	// ==================== REQUIRED ABSTRACT METHODS ====================

	getCurrentState(): TextEngineBaseUserData {
		if (!this._$text) return { transformations: {} };
		return this._$text.getValue();
	}

	isInteractionComplete(): boolean {
		const progress = this.getProgress();
		return progress.current === progress.total;
	}

	onHint(): void {
		// Find first non-edited target and show hint
		const userData = this.getCurrentState();
		const transformations = userData.transformations ?? {};

		for (let i = 0; i < this.data.targets.length; i++) {
			if (!transformations[i] || transformations[i].length === 0) {
				const target = this.data.targets[i];
				const originalWords = target.words.join(' ');
				const expectedWords = this._expectedTransformations[i]?.join(' ') || originalWords;
				this.emitHintShown(`Transform "${originalWords}" to "${expectedWords}"`);
				return;
			}
		}

		this.emitHintShown('All transformations have been attempted!');
	}

	// ==================== STATE & GRADING ====================

	getUserData(): TextEngineBaseUserData {
		return this.getCurrentState();
	}

	public submit(): void {
		super.submit();
		const result = this.grade();
		this.dispatchEvent(new CustomEvent('interaction:graded', {
			detail: { result },
			bubbles: true,
			composed: true
		}));
	}

	grade() {
		const userData = this.getUserData();
		const result = textEngineTransformationGrader(
			this.data,
			userData,
			this._expectedTransformations
		);

		// Generate grading state for visual feedback
		const gradingState: Record<number, any> = {};

		for (let i = 0; i < this.data.targets.length; i++) {
			const expected = this._expectedTransformations[i];
			const actual = userData.transformations?.[i];

			if (!actual) {
				gradingState[i] = 'missed';
			} else if (expected && expected.length === actual.length) {
				const matches = expected.every((word, j) =>
					word.toLowerCase().trim() === (actual[j] || '').toLowerCase().trim()
				);
				gradingState[i] = matches ? 'correct' : 'wrong';
			} else {
				gradingState[i] = 'wrong';
			}
		}

		// Apply grading visualization
		if (this._$text) {
			this._$text.setGradingState(gradingState);
		}

		return result;
	}

	reset() {
		super.reset();
		if (this._$text) {
			this._$text.reset();
			this._$text.clearGradingState();
		}
	}

	/**
	 * Set the expected transformations after construction
	 * Useful for dynamic configuration
	 */
	setExpectedTransformations(transformations: Record<number, string[]>) {
		this._expectedTransformations = transformations;
	}
}

if (!customElements.get('text-transformation')) {
	customElements.define('text-transformation', TextTransformation);
}
