import { BaseInteraction } from "../../../core/BaseInteraction";
import { Variant } from "../../../shared/types";
import { InteractionConfig, InteractionMechanic, IInteractionSpec } from "../../../types/Interactions";

import { NormalizedAssets } from "../../../shared/assets";
import { AssociationData } from "../../../types/Data";

import { associationDataGrader } from "../utilities/grader";
import { randomHexColorsList, shuffle } from "../../../shared/utils";

import { EduChip, setUpChipData } from "../../../ui/misc/chip";

// could expand something like: mechanic: 'click' | 'drawLine'; 
type SimultaneousAssociationSpec = {
	rightColumnLabel: string;
	leftColumnLabel: string;
	layoutDirection: 'vertical' | 'horizontal';
}

export class SimultaneousAssociation extends BaseInteraction<AssociationData> {

	interactionMechanic: InteractionMechanic = "static";

	private leftItems: string[] = [];
	private rightItems: string[] = [];

	private matched: Map<string, string> = new Map<string, string>();
	private matchColors: Map<string, string> = new Map<string, string>();

	private currentSelected: string;
	private currentEl: EduChip;
	private currentColor: string;

	private $leftCol: HTMLDivElement;
	private $rightCol: HTMLDivElement;

	constructor(
		data: AssociationData, 
		config: InteractionConfig, 
		assets: NormalizedAssets | null,
		spec: SimultaneousAssociationSpec | null
	) {
		super(data, config, assets);

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

	// ------------ Interaction Specific Logic ---------------

	render(): void {
		this.innerHTML = `
			<style>
				:host {
					--current-color: #3b82f6;
					display: flex;
					width: 100%;
					height: 100%;
					box-sizing: border-box;
				}

				.container {
					display: grid;
					grid-template-columns: 1fr 1fr;
					gap: 2.5rem;
					padding: 2rem;
					width: 100%;
					height: 100%;
					align-content: center;
					box-sizing: border-box;
				}

				.column {
					display: flex;
					flex-direction: column;
					gap: 0.5rem;
					justify-content: flex-start;
					width: 100%;
					max-width: 400px;
					margin: 0 auto;
				}

				.column-label {
					font-size: 0.9rem;
					font-weight: 600;
					color: rgb(var(--edu-second-ink));
					margin-bottom: 0.25rem;
					flex-shrink: 0;
				}

				.items-list {
					display: flex;
					flex-direction: column;
					gap: 0.75rem;
				}

				edu-chip:hover {
					transform: translateY(-2px);
				}

				edu-chip::part(content-zone) { width: 80%; }

				@media (max-width: 768px) {
					.container {
						gap: 1.5rem;
						padding: 1.5rem;
					}
				}
			</style>

			<div class="container" id="columns-container">
				<div class="column">
					<div class="column-label">Left Items (Select to match)</div>
					<div class="items-list" id="left-col"></div>
				</div>
				<div class="column">
					<div class="column-label">Right Items (Select to match)</div>
					<div class="items-list" id="right-col"></div>
				</div>
			</div>
		`;

		this.$leftCol = this.querySelector("#left-col") as HTMLDivElement;
		this.$rightCol = this.querySelector("#right-col") as HTMLDivElement;
		this.renderItems();
	}

	private renderItems() {
		this.leftItems.forEach((item, i) => {
			const chip = document.createElement('edu-chip') as EduChip;
			chip.variant = this.config.variant;
			
			setUpChipData(item, chip, this.assets?.assetsById);
			chip.dataset.val = item;
			chip.prefix = `${i+1})`;

			chip.addEventListener("click", (e) => {
				const chip = e.currentTarget as EduChip;
				const val = chip.dataset.val;

				if (this.currentSelected === val) {
					chip.selected = false;
					this.currentSelected = '';
					this.currentEl = null;
					return;
				}

				if (this.matched.get(val)) {
					const rightElVal = this.matched.get(val);
					const rightChip = this.querySelector(`[data-val="${rightElVal}"]`) as EduChip;
					
					chip.color = "";
					chip.colored = false;

					rightChip.colored = false;
					rightChip.color = "";

					this.matched.delete(val);
					this.matchColors.delete(val);
					this.decrementProgress();
					this.emitStateChange();

					return;
				}
				
				if (this.currentSelected) this.currentEl.selected = false; 
				this.currentSelected = val;
				this.currentEl = chip;
				chip.selected = true;
			});

			this.$leftCol.append(chip);
		});

		this.rightItems.forEach((item, i) => {
			const chip = document.createElement('edu-chip') as EduChip;
			chip.variant = this.config.variant;

			setUpChipData(item, chip, this.assets?.assetsById);
			chip.dataset.val = item;
			chip.dataset.colorIndex = `${i+1}`; 
			chip.prefix = `${i+1})`;  

			chip.addEventListener("click", (e) => {
				const chip = e.currentTarget as EduChip;
				const val = chip.dataset.val;

				if (this.currentSelected === val) {
					this.currentSelected = '';
					this.currentEl = null;
					chip.selected = false;
					return;
				}

				const mapVals = [...this.matched.values()];
				if (mapVals.includes(val)) return;

				if (this.currentSelected) {
					if (this.leftItems.includes(this.currentSelected) && this.rightItems.includes(val)) {
						const colorIndex = Number(chip.dataset.colorIndex) % randomHexColorsList.length;
						const matchColor = randomHexColorsList[colorIndex];

						this.matched.set(this.currentSelected, val);
						this.matchColors.set(this.currentSelected, matchColor);

						chip.selected = false;
						this.currentEl.selected = false;

						chip.color = matchColor;
						chip.colored = true;

						this.currentEl.color = matchColor;
						this.currentEl.colored = true;

						this.incrementProgress();
						this.emitStateChange();

						this.currentSelected = '';
						this.currentEl = null;
						return;
					} else {
						this.currentEl.selected = false;
					}
				}

				this.currentSelected = val;
				this.currentEl = chip;
				chip.selected = true;
			});

			this.$rightCol.append(chip);
		});
	}

	// ------------ Abstract Methods ---------------

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
		
		const result = associationDataGrader(this.data.pairs, this.matched, this);
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
