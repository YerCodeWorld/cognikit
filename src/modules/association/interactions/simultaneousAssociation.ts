import { BaseInteraction } from "../../../core/BaseInteraction";
import { InteractionConfig, AssociationData, Variant } from "../../../shared/types";
import { randomHexColorsList, shuffle } from "../../../shared/utils";
import { EduChip } from "../../../ui/misc/chip";

export class SimultaneousAssociation extends BaseInteraction<AssociationData> {

	private leftItems: string[] = [];
	private rightItems: string[] = [];

	private matched: Map<string, string> = new Map<string, string>();
	private matchColors: Map<string, string> = new Map<string, string>();

	private currentSelected: string;
	private currentEl: EduChip;
	private currentColor: string;

	private $leftCol: HTMLDivElement;
	private $rightCol: HTMLDivElement;

	constructor(data: AssociationData, config: InteractionConfig) {
		super(data, config);

		this.data.pairs.forEach(({ left, right }) => {
			this.leftItems.push(left);
			this.rightItems.push(right);
		});

		if (this.data.distractors) this.rightItems.push(...this.data.distractors);

		if (this.config.shuffle) {
			this.leftItems = shuffle(this.leftItems);
			this.rightItems = shuffle(this.rightItems);
		}

		this.initializeProgress(this.leftItems.length);
		this.currentColor = randomHexColorsList[0];
	}

	protected initialize(): void {}
	protected cleanup(): void {}

	onVariantChange(newVariant: Variant): void {
		this.querySelectorAll('edu-chip').forEach((el: EduChip) => {
			if (el.variant !== undefined) el.variant = newVariant;
		});
	}

	render(): void {
		this.innerHTML = `
			<style>
				:host {
					--current-color: #3b82f6;
					display: block;
				}

				.container {
					display: grid;
					grid-template-columns: 1fr 1fr;
					gap: 40px;
					padding: 1rem 4rem 1rem 4rem;
				}

				.column {
					display: flex;
					flex-direction: column;
					gap: 0.75rem;
					justify-content: center;
					width: 100%;
					margin: 0 auto;
				}

				edu-chip:hover {
					transform: translateY(-2px);
				}

				edu-chip.selected {
					position: relative;
				}

				edu-chip.selected::before {
					content: '';
					position: absolute;
					top: -2px;
					left: -2px;
					right: -10px;
					bottom: -2px;
					border-radius: 10px;
					border: 3px solid #3b82f6;
					background: rgb(var(--edu-second-accent));
					opacity: 0.4;
					pointer-events: none;
				}

				edu-chip.colorized {
					position: relative;
				}

				edu-chip.colorized::before {
					content: '';
					position: absolute;
					top: -2px;
					left: -2px;
					right: -10px;
					bottom: -2px;
					border-radius: 10px;
					border: 3px solid var(--current-color);
					background: var(--current-color);
					opacity: 0.2;
					pointer-events: none;
				}
			</style>

			<div class="container" id="columns-container">
				<div class="column" id="left-col"></div>
				<div class="column" id="right-col"></div>
			</div>
		`;

		this.$leftCol = this.querySelector("#left-col");
		this.$rightCol = this.querySelector("#right-col");
		this.renderItems();
	}

	private renderItems() {
		this.leftItems.forEach(item => {
			const chip = document.createElement('edu-chip') as EduChip;
			chip.variant = this.config.variant;
			chip.textContent = item;
			chip.dataset.val = item;

			chip.addEventListener("click", (e) => {
				const chip = e.currentTarget as EduChip;
				const val = chip.dataset.val;

				if (this.currentSelected === val) {
					chip.classList.remove('selected');
					this.currentSelected = '';
					this.currentEl = null;
					return;
				}

				if (this.matched.get(val)) {
					const rightElVal = this.matched.get(val);
					const rightChip = this.querySelector(`[data-val="${rightElVal}"]`) as EduChip;

					chip.classList.remove('colorized');
					chip.style.setProperty('--current-color', '');
					rightChip.classList.remove('colorized');
					rightChip.style.setProperty('--current-color', '');

					this.matched.delete(val);
					this.matchColors.delete(val);
					this.decrementProgress();
					this.emitStateChange();
					return;
				}

				if (this.currentSelected) this.currentEl.classList.remove('selected');
				this.currentSelected = val;
				this.currentEl = chip;
				chip.classList.add('selected');
			});

			this.$leftCol.append(chip);
		});

		this.rightItems.forEach(item => {
			const chip = document.createElement('edu-chip') as EduChip;
			chip.variant = this.config.variant;
			chip.textContent = item;
			chip.dataset.val = item;

			chip.addEventListener("click", (e) => {
				const chip = e.currentTarget as EduChip;
				const val = chip.dataset.val;

				if (this.currentSelected === val) {
					this.currentSelected = '';
					this.currentEl = null;
					chip.classList.remove('selected');
					return;
				}

				const mapVals = [...this.matched.values()];
				if (mapVals.includes(val)) return;

				if (this.currentSelected) {
					if (this.leftItems.includes(this.currentSelected) && this.rightItems.includes(val)) {
						const colorIndex = this.matched.size % randomHexColorsList.length;
						const matchColor = randomHexColorsList[colorIndex];

						this.matched.set(this.currentSelected, val);
						this.matchColors.set(this.currentSelected, matchColor);

						chip.classList.add('colorized');
						chip.style.setProperty('--current-color', matchColor);
						this.currentEl.classList.remove('selected');
						this.currentEl.classList.add('colorized');
						this.currentEl.style.setProperty('--current-color', matchColor);
						this.incrementProgress();
						this.emitStateChange();

						this.currentSelected = '';
						this.currentEl = null;
						return;
					} else {
						this.currentEl.classList.remove('selected');
					}
				}

				this.currentSelected = val;
				this.currentEl = chip;
				chip.classList.add('selected');
			});

			this.$rightCol.append(chip);
		});
	}

	getCurrentState(): any {
		return {
			matched: Object.fromEntries(this.matched),
			progress: this.progressTracker.current
		};
	}

	isInteractionComplete(): boolean {
		if (this.matched.size !== this.leftItems.length) return false;
		return true;
	}

	onHint(): void {
		const unmatched = this.leftItems.filter(item => !this.matched.has(item));

		if (unmatched.length === 0) {
			alert('All items are matched! Click "Check" to submit.');
			this.emitHintShown('All items matched');
			return;
		}

		const firstUnmatched = unmatched[0];
		alert(`Hint: You haven't matched "${firstUnmatched}" yet. Select it from the left, then select its match from the right.`);
		this.emitHintShown(`Unmatched: ${firstUnmatched}`);
	}

	public submit(): void {
		super.submit();

		// Grade the associations
		let correct = 0;
		for (const [left, right] of this.matched.entries()) {
			const correctPair = this.data.pairs.find(p => p.left === left);
			if (correctPair && correctPair.right === right) {
				correct++;
			}
		}

		const total = this.data.pairs.length;
		const score = total > 0 ? (correct / total) * 100 : 0;

		console.log(`Association Score: ${score.toFixed(1)}% (${correct}/${total} correct)`);

		const result = { score, correct, total };

		this.dispatchEvent(new CustomEvent('interaction:graded', {
			detail: { result },
			bubbles: true,
			composed: true
		}));
	}

	public reset(): void {
		super.reset();
		this.matched.clear();
		this.matchColors.clear();
		this.currentSelected = '';
		this.currentEl = null;
		this.querySelectorAll('edu-chip').forEach((chip: EduChip) => {
			chip.classList.remove('colorized', 'selected');
			chip.style.setProperty('--current-color', '');
		});
	}
}

if (!customElements.get('simultaneous-association')) {
	customElements.define('simultaneous-association', SimultaneousAssociation);
}
