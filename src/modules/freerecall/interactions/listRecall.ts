import { BaseInteraction } from "../../../core/BaseInteraction";
import { Variant } from "../../../shared/types";
import { InteractionConfig, InteractionMechanic } from "../../../types/Interactions";
import { FreeRecallData } from "../../../types/Data";
import { GradingResult } from "../../../types/Grading";
import { EduChip } from "../../../ui/misc/chip";
import { EduInput } from "../../../ui/input/input";

export class ListRecall extends BaseInteraction<FreeRecallData> {

	interactionMechanic: InteractionMechanic = "static";

	private _$chipsContainer!: HTMLDivElement;
	private _$textInput!: EduInput;
	private _$addButton!: EduInput;
	private _recalledItems: Set<string> = new Set();

	constructor(data: FreeRecallData, config: InteractionConfig) {
		super(data, config);

		this.initializeProgress(data.items.length);
	}

	// ==================== LIFECYCLE ====================

	protected initialize(): void {}
	protected cleanup(): void {}

	onVariantChange(newVariant: Variant): void {
		if (this._$textInput) this._$textInput.variant = newVariant;
		if (this._$addButton) this._$addButton.variant = newVariant;
		this._$chipsContainer?.querySelectorAll('edu-chip').forEach(chip => {
			(chip as EduChip).variant = newVariant;
		});
	}

	// ==================== RENDERING ====================

	render(): void {
		this.innerHTML = `
			<style>
				list-recall {
					display: flex;
					flex-direction: column;
					width: 100%;
					height: 100%;
					padding: clamp(0.75rem, min(2cqw, 2cqh), 1.5rem);
					gap: clamp(0.5rem, min(1.6cqw, 1.6cqh), 1rem);
					box-sizing: border-box;
					container-type: size;
				}

				.chips-container {
					flex: 1;
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
					grid-auto-rows: minmax(44px, auto);
					gap: clamp(0.4rem, min(1.4cqw, 1.4cqh), 0.75rem);
					padding: clamp(0.5rem, min(1.6cqw, 1.6cqh), 1rem);
					border: 2px dashed rgb(var(--edu-border));
					border-radius: clamp(6px, 1.6cqw, 8px);
					background: rgb(var(--edu-bg));
					overflow-y: auto;
					align-content: start;
					min-height: 0;
				}

				.chips-container:empty::before {
					content: 'Your recalled items will appear here...';
					color: rgb(var(--edu-second-ink));
					font-size: 0.95rem;
					opacity: 0.6;
					font-style: italic;
				}

				hr {
					width: 100%;
					border: none;
					border-top: 1px solid rgb(var(--edu-border));
					margin: 0;
				}

				.input-row {
					display: flex;
					gap: clamp(0.4rem, min(1.4cqw, 1.4cqh), 0.75rem);
					align-items: center;
					flex-shrink: 0;
				}

				.input-row edu-input[type="text"] {
					flex: 1;
				}

				.input-row edu-input[type="button"] {
					flex-shrink: 0;
				}

				edu-chip {
					cursor: pointer;
					transition: opacity 0.2s ease;
				}

				edu-chip:hover {
					opacity: 0.7;
				}

				@container (max-width: 640px) {
					.chips-container {
						grid-template-columns: repeat(auto-fit, minmax(min(100%, 120px), 1fr));
					}
				}
			</style>

			<div class="chips-container"></div>
			<hr>
			<div class="input-row">
				<edu-input type="text" placeholder="Enter an item..."></edu-input>
				<edu-input as="button">Add</edu-input>
			</div>
		`;

		// Get references
		this._$chipsContainer = this.querySelector('.chips-container') as HTMLDivElement;
		this._$textInput = this.querySelector('edu-input[type="text"]') as EduInput;
		this._$addButton = this.querySelector('edu-input[as="button"]') as EduInput;

		// Set variant
		this._$textInput.variant = this.config.variant;
		this._$addButton.variant = this.config.variant;

		// Set up event listeners
		this._$addButton.addEventListener('click', () => this.handleAddItem());
		this._$textInput.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				this.handleAddItem();
			}
		});
	}

	// ==================== INTERACTION LOGIC ====================

	private handleAddItem(): void {
		const value = this._$textInput.value.trim();
		if (!value) return;

		const normalizedValue = value.toLowerCase();

		if (this._recalledItems.has(normalizedValue)) {
			alert('You have already added this item.');
			this._$textInput.value = '';
			return;
		}

		if (this._recalledItems.size >= this.data.items.length) {
			alert(`You can only add up to ${this.data.items.length} items.`);
			this._$textInput.value = '';
			return;
		}

		this._recalledItems.add(normalizedValue);
		this.addChip(value);
		
		this._$textInput.value = '';

		this.setProgress(this._recalledItems.size);

		this.emitStateChange();
	}

	private addChip(text: string): void {
		const chip = document.createElement('edu-chip') as EduChip;
		chip.textContent = text;
		chip.variant = this.config.variant;
		chip.value = text.toLowerCase(); // Store normalized value for removal

		// Click to remove
		chip.addEventListener('click', () => {
			const normalizedValue = chip.value;
			this._recalledItems.delete(normalizedValue);
			chip.remove();

			// Update progress
			this.setProgress(this._recalledItems.size);

			// Emit state change
			this.emitStateChange();
		});

		this._$chipsContainer.appendChild(chip);
	}

	getCurrentState(): string[] {
		return Array.from(this._recalledItems);
	}

	isInteractionComplete(): boolean {
		return this._recalledItems.size === this.data.items.length;
	}

	onHint(): void {
		const recalled = this._recalledItems.size;
		const total = this.data.items.length;

		if (recalled === 0) {
			alert(`Hint: Try to recall all ${total} items from memory.`);
			this.emitHintShown('No items recalled yet');
		} else if (recalled < total) {
			alert(`Hint: You've recalled ${recalled} out of ${total} items. Keep going!`);
			this.emitHintShown(`${recalled}/${total} items recalled`);
		} else {
			alert('Great! You\'ve recalled all items. Click "Check" to submit.');
			this.emitHintShown('All items recalled');
		}
	}

	// ==================== GRADING ====================

	public submit(): void {
		super.submit();
		const result = this.gradeRecall();
		console.log(`List Recall Score: ${result.score.toFixed(1)}% (${result.correct}/${result.total} correct)`);

		this.applyGradingFeedback(result);
		this.dispatchEvent(new CustomEvent('interaction:graded', {
			detail: { result },
			bubbles: true,
			composed: true
		}));
	}
	
	// TODO: Use our existing functions
	private gradeRecall(): GradingResult {
		const normalizedAnswerKey = this.data.items.map(item => item.toLowerCase());
		const userRecalled = Array.from(this._recalledItems);

		let correctCount = 0;

		// Count how many recalled items match the answer key
		for (const item of userRecalled) {
			if (normalizedAnswerKey.includes(item)) {
				correctCount++;
			}
		}

		const totalItems = this.data.items.length;
		const score = totalItems > 0 ? Math.round((correctCount / totalItems) * 100) : 0;

		return {
			score,
			correct: correctCount,
			total: totalItems,
			answerKey: this.data.items,
			userResponse: userRecalled
		};
	}

	private applyGradingFeedback(result: GradingResult): void {
		const normalizedAnswerKey = this.data.items.map(item => item.toLowerCase());
		const chips = this._$chipsContainer.querySelectorAll('edu-chip');

		chips.forEach((chip: EduChip) => {
			const chipValue = chip.value;

			if (normalizedAnswerKey.includes(chipValue)) {
				chip.chipState = 'correct';
			} else {
				chip.chipState = 'wrong';
			}
		});
	}

	// ==================== RESET ====================

	public reset(): void {
		super.reset();

		// Clear recalled items
		this._recalledItems.clear();

		// Clear chips container
		this._$chipsContainer.innerHTML = '';

		// Clear text input
		const input = this._$textInput.querySelector('.control') as HTMLInputElement;
		if (input) input.value = '';

		// Reset progress
		this.setProgress(0);

		// Remove grading state from chips (already cleared)
	}
}

if (!customElements.get('list-recall')) {
	customElements.define('list-recall', ListRecall);
}
