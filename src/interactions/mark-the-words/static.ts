import { BaseInteraction } from "../../core/BaseInteraction";
import { Variant } from "../../shared/types";
import { InteractionConfig, InteractionMechanic } from "../../types/Interactions";
import { TextEngineBaseData, TextEngineConfiguration } from "../../types/Text";

import {
	EduText,

	textEngineHighlightGrader,
	getHighlightGradingState,

	type TextEngineBaseUserData
} from "../../engines/text";

/**
 * Mark The Words - Text Highlight Interaction
 *
 * Users click to select/highlight target words in a passage of text.
 * Based on the TextEngineBaseData with highlight mode.
 *
 * Example data:
 * ```
 * {
 *   type: 'base',
 *   parts: ['The', 'cat', 'sat', 'on', 'the', 'mat'],
 *   targets: [
 *     { words: ['cat'], startPos: 1, endPos: 1 },
 *     { words: ['mat'], startPos: 5, endPos: 5 }
 *   ]
 * }
 * ```
 */
export class MarkTheWords extends BaseInteraction<TextEngineBaseData> {

	interactionMechanic: InteractionMechanic = "static";

	private _textConfig: TextEngineConfiguration;
	private _$text!: EduText;

	constructor(data: TextEngineBaseData, config: InteractionConfig) {
		super(data, config);

		// Configure text engine for highlight mode
		this._textConfig = {
			data: data,
			mode: 'highlight',
			variant: config.variant ?? 'outline'
		};

		this.implementsProgress = false;
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
			this.emitStateChange();
		});

		// Render with wrapper for proper height/overflow handling
		this.innerHTML = `
			<style>
				mark-the-words {
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
	//
	// ==================== REQUIRED ABSTRACT METHODS ====================

	getCurrentState(): TextEngineBaseUserData {
		if (!this._$text) return { selectedIndices: [] };
		return this._$text.getValue();
	}

	isInteractionComplete(): boolean {
		const userData = this.getCurrentState();
		const selected = new Set(userData.selectedIndices ?? []);

		for (const target of this.data.targets) {
			for (let i = target.startPos; i <= target.endPos; i++) {
				if (!selected.has(i)) return false;
			}
		}

		return true;
	}

	onHint(): void {
		// Highlight one random unselected target word
		const userData = this.getCurrentState();
		const selectedIndices = new Set(userData.selectedIndices ?? []);

		// Find all unselected target indices
		const unselectedTargets: number[] = [];
		for (const target of this.data.targets) {
			for (let i = target.startPos; i <= target.endPos; i++) {
				if (!selectedIndices.has(i)) {
					unselectedTargets.push(i);
				}
			}
		}

		if (unselectedTargets.length > 0) {
			const randomIndex = unselectedTargets[Math.floor(Math.random() * unselectedTargets.length)];
			const word = this.data.parts[randomIndex];
			this.emitHintShown(`Try selecting: "${word}"`);
		} else {
			this.emitHintShown('All target words have been selected!');
		}
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
		const result = textEngineHighlightGrader(this.data, userData);

		// Generate word-level grading state for visual feedback
		const wordGradingState = getHighlightGradingState(this.data, userData);

		// Apply grading visualization
		if (this._$text) {
			this._$text.setGradingState(wordGradingState);
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
}

if (!customElements.get('mark-the-words')) {
	customElements.define('mark-the-words', MarkTheWords);
}
