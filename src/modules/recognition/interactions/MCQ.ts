import { BaseInteraction } from "../../../core/BaseInteraction";
import { Variant } from "../../../shared/types";
import { InteractionConfig, InteractionMechanic } from "../../../types/Interactions";
import { NormalizedAssets } from "../../../shared/assets";
import { RecognitionData } from "../../../types/Data";

import { EduChip, setUpChipData } from "../../../ui/misc/chip";
import { EduBlock } from "../../../ui/misc/block";

import { shuffle } from "../../../shared";
import { recognitionGrader, RecognitionAnswers } from "../utilities/grader";

export class MCQ extends BaseInteraction<RecognitionData> {

	interactionMechanic: InteractionMechanic = "sequential";

	private currentQuestionIndex: number = 0;
	private userAnswers: RecognitionAnswers = {};
	private shuffledOptions: Map<string, string[]> = new Map(); // Store shuffled order per question
	private isGraded: boolean = false;

	private $questionBlock!: EduBlock;
	private $questionText!: HTMLElement;
	private $optionsContainer!: HTMLDivElement;
	private $modeLabel!: HTMLElement;

	// Expose question count for shell
	public get slidesCount(): number {
		return this.data.data.length;
	}

	constructor(
		data: RecognitionData,
		config: InteractionConfig,
		assets: NormalizedAssets | null
	) {
		super(data, config, assets);
		
		// Initialize user answers and shuffle options once
		this.data.data.forEach(q => {
			this.userAnswers[q.question] = [];

			// Shuffle and store options order
			if (this.config.shuffle) {
				this.shuffledOptions.set(q.question, shuffle([...q.options]));
			} else {
				this.shuffledOptions.set(q.question, [...q.options]);
			}
		});

		// Initialize progress tracking (one per question)
		this.initializeProgress(this.data.data.length);
	}

	protected initialize(): void {}
	protected cleanup(): void {}

	onVariantChange(newVariant: Variant): void {
		this.querySelectorAll('edu-chip, edu-block').forEach((el: EduChip | EduBlock) => {
			if (el.variant !== undefined) {
				el.variant = newVariant;
			}
		});
	}

	// ==================== SEQUENTIAL NAVIGATION ====================

	/**
	 * Called by shell when radio navigation changes
	 * @param stepIndex 1-based index from shell
	 */
	public setSteps(stepIndex: number): void {
		// Convert from 1-based to 0-based
		const newIndex = stepIndex - 1;

		if (newIndex >= 0 && newIndex < this.data.data.length) {
			this.currentQuestionIndex = newIndex;
			this.renderCurrentQuestion();
		}
	}

	// ==================== RENDERING ====================

	render(): void {
		this.innerHTML = `
			<style>
				:host {
					display: flex;
					width: 100%;
					height: 100%;
					box-sizing: border-box;
				}

				.container {
					display: flex;
					flex-direction: column;
					width: 100%;
					height: 100%;
					gap: 1rem;
					padding: 1.5rem;
					box-sizing: border-box;
					overflow: hidden;
				}

				.mode-label {
					position: absolute;
					top: 0.5rem;
					left: 0.5rem;
					font-size: 0.75rem;
					font-weight: 600;
					color: rgb(var(--edu-third-ink));
					text-transform: uppercase;
					letter-spacing: 0.5px;
					opacity: 0.7;
				}

				.question-section {
					flex-shrink: 0;
					position: relative;
					min-height: 80px;
				}

				.question-text {
					padding: 1.5rem;
					font-size: 1.1rem;
					font-weight: 600;
					color: rgb(var(--edu-ink));
					line-height: 1.5;
				}

				.divider {
					border: none;
					border-top: 1px solid rgb(var(--edu-border));
					margin: 0;
					flex-shrink: 0;
				}

				.options-section {
					flex: 1;
					display: flex;
					flex-direction: column;
					gap: 0.5rem;
					min-height: 0;
					overflow: hidden;
				}

				.options-label {
					font-size: 0.9rem;
					font-weight: 600;
					color: rgb(var(--edu-second-ink));
					flex-shrink: 0;
				}

				.options-container {
					flex: 1;
					display: grid;
					grid-template-columns: repeat(3, 1fr);
					gap: 0.75rem;
					padding: 1rem;
					background: rgb(var(--edu-muted));
					border-radius: 8px;
					overflow-y: auto;
					overflow-x: hidden;
					min-height: 0;
					align-content: start;
				}

				edu-chip {
					cursor: pointer;
					transition: all 0.2s ease;
				}

				edu-chip::part(block) { width: 100%; }

				edu-chip:hover {
					transform: translateY(-2px);
				}

				edu-chip.selected {
					transform: translateY(-2px);
				}

				@media (max-width: 640px) {
					.container {
						padding: 1rem;
					}

					.question-text {
						padding: 1rem;
						font-size: 1rem;
					}

					.options-container {
						grid-template-columns: 1fr;
						padding: 0.75rem;
					}
				}
			</style>

			<div class="container">
				<div class="question-section">
					<div class="mode-label"></div>
					<div id="question-block"></div>
				</div>

				<hr class="divider">

				<div class="options-section">
					<div class="options-label">Options</div>
					<div class="options-container"></div>
				</div>
			</div>
		`;

		// Cache DOM elements
		this.$modeLabel = this.querySelector('.mode-label')!;
		this.$optionsContainer = this.querySelector('.options-container')!;

		const questionBlockContainer = this.querySelector('#question-block')!;
		this.$questionBlock = document.createElement('edu-block') as EduBlock;
		this.$questionBlock.variant = this.config.variant;
		this.$questionBlock.innerHTML = '<div class="question-text"></div>';
		questionBlockContainer.appendChild(this.$questionBlock);

		this.$questionText = this.$questionBlock.querySelector('.question-text')!;

		// Render first question
		this.renderCurrentQuestion();
	}

	private renderCurrentQuestion(): void {

		const question = this.data.data[this.currentQuestionIndex];
		if (!question) return;

		const isMCQ = question.correctOptions.length === 1;
		this.$modeLabel.textContent = isMCQ ? 'Multiple Choice' : 'Multiple Response';

		// TODO: Remmeber this will be updated to use a container that accepts different modalities
		this.$questionText.textContent = question.question;

		const options = this.shuffledOptions.get(question.question) || question.options;
		
		this.$optionsContainer.innerHTML = '';
		options.forEach((option, i) => {
			const chip = document.createElement('edu-chip') as EduChip;
			chip.variant = this.variant;
			chip.prefix = `${i + 1}:`;
			chip.dataset.option = option;

			setUpChipData(option, chip, this.assets?.assetsById);

			const isSelected = this.userAnswers[question.question]?.includes(option);
			if (isSelected) {
				chip.selected = true;
				chip.classList.add('selected');
			}

			// Show correctness state if graded
			if (this.isGraded) {
				const isCorrect = question.correctOptions.includes(option);
				if (isSelected && isCorrect) {
					chip.chipState = 'correct';
				} else if (isSelected && !isCorrect) {
					chip.chipState = 'wrong';
				} else if (!isSelected && isCorrect) {
					chip.chipState = 'missed';
				}
			}

			if (!this.isGraded) {
				chip.addEventListener('click', () => {
					this.handleOptionClick(option, chip, isMCQ);
				});
			}

			this.$optionsContainer.appendChild(chip);
		});
	}

	private handleOptionClick(option: string, chip: EduChip, isMCQ: boolean): void {

		const question = this.data.data[this.currentQuestionIndex];
		const selected = this.userAnswers[question.question];

		if (isMCQ) {
			// Single selection - clear all others
			const wasSelected = selected.includes(option);
			
			// Clear all selections visually and in state
			this.$optionsContainer.querySelectorAll('edu-chip').forEach((c: EduChip) => {
				c.selected = false;
				c.classList.remove('selected');
			});
			this.userAnswers[question.question] = [];

			// Toggle this option
			if (!wasSelected) {
				chip.selected = true;
				chip.classList.add('selected');
				this.userAnswers[question.question] = [option];
			}
		} else {
			const index = selected.indexOf(option);
			if (index > -1) {
				selected.splice(index, 1);
				chip.selected = false;
				chip.classList.remove('selected');
			} else {
				selected.push(option);
				chip.selected = true;
				chip.classList.add('selected');
			}
		}

		this.updateProgress();
		this.emitStateChange();
	}

	private updateProgress(): void {
		let answeredCount = 0;
		this.data.data.forEach(q => {
			if (this.userAnswers[q.question]?.length > 0) {
				answeredCount++;
			}
		});

		this.setProgress(answeredCount);
	}

	// ==================== INTERACTION LOGIC ====================

	getCurrentState(): RecognitionAnswers {
		return { ...this.userAnswers };
	}

	isInteractionComplete(): boolean {
		// All questions must have at least one selection
		return this.data.data.every(q =>
			this.userAnswers[q.question]?.length > 0
		);
	}

	onHint(): void {
		const question = this.data.data[this.currentQuestionIndex];
		const hasAnswer = this.userAnswers[question.question]?.length > 0;

		if (!hasAnswer) {
			alert(`Hint: This question requires at least one selection. Read the question carefully and choose the best answer(s).`);
			this.emitHintShown(`No answer selected for question ${this.currentQuestionIndex + 1}`);
		} else {
			alert(`Hint: You've selected an answer. Review your choice and make sure it's correct before submitting.`);
			this.emitHintShown(`Answer exists for question ${this.currentQuestionIndex + 1}`);
		}
	}

	// ==================== GRADING ====================

	public submit(): void {
		super.submit();

		const result = recognitionGrader(this.data, this.userAnswers);

		console.log(`Recognition Score: ${result.score}% (${result.correct}/${result.total} questions fully correct)`);

		// Mark as graded and re-render to show correctness states
		this.isGraded = true;
		this.renderCurrentQuestion();

		this.dispatchEvent(new CustomEvent('interaction:graded', {
			detail: { result },
			bubbles: true,
			composed: true
		}));

		this.setAttribute('inert', '');
	}

	// ==================== RESET ====================

	public reset(): void {
		super.reset();

		this.data.data.forEach(q => {
			this.userAnswers[q.question] = [];
		});

		this.isGraded = false;

		this.currentQuestionIndex = 0;

		this.renderCurrentQuestion();
	}
}

if (!customElements.get('mcq-interaction')) {
	customElements.define('mcq-interaction', MCQ);
}
