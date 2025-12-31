import HTML from './index.html';
import { BaseInteraction } from "../../core/BaseInteraction";
import { ItemData, Variant } from "../../shared";

// update the shell do that it receives a config: IBaseShellConfig object
/** type IBaseShellConfig {
	variant: Variant;  
	prompt: string;  
	
	headerEnabled: boolean;  // 'promptEnabled' instead...
	promtEnabled: boolean;
	counterEnabled: boolean;
	timer: number;

	autoCheckButton: boolean;
	
	footerEnabled: boolean;
	footerAction: 'check' | 'navigation'; 
	
	stimulus: Stimulus; 

	animationsEnabled: boolean;

	retries: number;
	construct: string;  // specify what we are measuring (could be used as a label in the display)
}**/ 

export class InteractionsBaseShell extends HTMLElement {

	static get observedAttributes() {
		return [
			'variant',
			'heading',
			'show-header',
			'show-footer',
			'footer-mode',
			'timer',
			'radio-count',
			'show-hint-button'  // New: optional hint button
		];
	}

	// ==================== DOM ELEMENTS ====================

	private $titleEl!: HTMLElement;
	private $timerEl!: HTMLElement;
	private $headerEl!: HTMLElement;
	private $footerEl!: HTMLElement;
	private $contentEl!: HTMLElement;
	private $wrapEl!: HTMLElement;
	private $styleEl!: HTMLStyleElement;
	private $checkBtn!: HTMLButtonElement;
	// private $hintBtn!: HTMLButtonElement;
	private $radioNav!: HTMLElement;
	private $progressBar!: HTMLProgressElement;

	// ==================== STATE ====================

	private interaction?: BaseInteraction<any>;
	private timerInterval: number | null = null;
	private remainingSeconds: number = 0;
	private interactionComplete = false;

	// ==================== CONSTRUCTOR ====================

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });

		// Styles
		this.$styleEl = document.createElement('style');
		this.shadowRoot!.append(this.$styleEl);

		// HTML structure
		const wrap = document.createElement('section');
		wrap.className = "wrap";
		wrap.innerHTML = HTML;

		this.shadowRoot!.append(wrap);
		this.$wrapEl = wrap;

		// Cache element references
		this.$headerEl = wrap.querySelector('header')!;
		this.$titleEl = wrap.querySelector('.title')!;
		this.$timerEl = wrap.querySelector('.timer')!;
		this.$footerEl = wrap.querySelector('#footer')!;
		this.$checkBtn = wrap.querySelector('.check-btn')!;
		this.$radioNav = wrap.querySelector('.radio-nav')!;
		this.$progressBar = wrap.querySelector('.progress-bar')!;
		this.$contentEl = wrap.querySelector('[part="content"]')!;

		// Create hint button
		// this.$hintBtn = document.createElement('button');
		// this.$hintBtn.textContent = '💡 Hint';
		// this.$hintBtn.className = 'hint-btn';
		// this.$hintBtn.dataset.hidden = 'true';
		// this.$footerEl.appendChild(this.$hintBtn);

		// Set up shell's own event listeners
		this.setupShellListeners();
	}

	// ==================== LIFECYCLE ====================

	connectedCallback() {
		// Set defaults
		if (!this.hasAttribute("variant")) this.setAttribute("variant", "elegant");
		if (!this.hasAttribute("show-header")) this.setAttribute("show-header", "true");
		if (!this.hasAttribute("show-footer")) this.setAttribute("show-footer", "true");
		if (!this.hasAttribute("footer-mode")) this.setAttribute("footer-mode", "static");
		if (!this.hasAttribute("timer")) this.setAttribute("timer", "0");
		// if (!this.hasAttribute("show-hint-button")) this.setAttribute("show-hint-button", "false");

		this.sync();

		// Initially hide action buttons
		this.$checkBtn.dataset.hidden = 'true';
		// this.$hintBtn.dataset.hidden = 'true';
	}

	disconnectedCallback() {
		this.stopTimer();
		this.removeInteractionListeners();
	}

	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if (oldValue === newValue) return;

		if (name === 'timer') {
			this.initTimer();
		}

		if (name === 'variant' && this.interaction) {
			this.interaction.onVariantChange(newValue as Variant);
		}

		this.sync();
	}

	// ==================== INTERACTION MANAGEMENT ====================

	/**
	 * Set the interaction for this shell
	 * Connects event listeners and renders interaction
	 */
	public setInteraction<T extends ItemData>(interaction: BaseInteraction<T>): void {
		// Remove previous interaction if exists
		if (this.interaction) {
			this.removeInteractionListeners();
			this.$contentEl.innerHTML = '';
		}

		this.interaction = interaction;
		this.interactionComplete = false;

		// Listen to interaction events
		this.setupInteractionListeners();

		// Render interaction in content area
		this.$contentEl.innerHTML = '';
		this.$contentEl.appendChild(interaction);

		// Show hint button if configured
		// if (this.getAttribute('show-hint-button') === 'true') {
		//	this.$hintBtn.dataset.hidden = 'false';
		//}
	}

	/**
	 * Remove current interaction
	 */
	public removeInteraction(): void {
		if (this.interaction) {
			this.removeInteractionListeners();
			this.$contentEl.innerHTML = '';
			this.interaction = undefined;
			this.interactionComplete = false;
		}
	}

	// ==================== EVENT LISTENERS ====================

	private setupShellListeners(): void {
		// Check button clicked
		this.$checkBtn.addEventListener('click', () => {
			if (this.interaction && this.interactionComplete) {
				try {
					this.interaction.submit();
				} catch (error) {
					console.error('Submit failed:', error);
				}
			}
		});

		// Hint button clicked
		// this.$hintBtn.addEventListener('click', () => {
		//	if (this.interaction) {
		//		this.interaction.hint();
		//	}
		//});

		// Radio navigation (for sequential mode)
		this.$radioNav.addEventListener('change', (e) => {
			const target = e.target as HTMLInputElement;

			if (target.type === 'radio') {
				const stepIndex = parseInt(target.id.replace('step-', ''), 10);

				if (this.interaction) {
					this.interaction.setSteps(stepIndex);
				}

				this.dispatchEvent(new CustomEvent('navigation-change', {
					detail: { step: stepIndex },
					bubbles: true,
					composed: true
				}));
			}
		});
	}
	
	// i just love this piece of code buddy 
	private setupInteractionListeners(): void {
		if (!this.interaction) return;

		// Ready - interaction initialized
		this.interaction.addEventListener('interaction:ready', ((e: CustomEvent) => {
			console.log('[Shell] Interaction ready:', e.detail.id);
		}) as EventListener);

		// Progress update
		this.interaction.addEventListener('interaction:progress', ((e: CustomEvent) => {
			const { current, total, percentage } = e.detail;
			this.updateProgress(current, total);

			// Auto-show check button when complete
			if (current === total && total > 0) {
				this.interactionComplete = true;
				this.$checkBtn.dataset.hidden = 'false';
			} else {
				this.interactionComplete = false;
				this.$checkBtn.dataset.hidden = 'true';
			}
		}) as EventListener);

		// State change - user modified response
		this.interaction.addEventListener('interaction:state-change', ((e: CustomEvent) => {
			const { state, isComplete } = e.detail;
			this.interactionComplete = isComplete;

			// Show/hide check button based on completion
			if (isComplete) {
				this.$checkBtn.dataset.hidden = 'false';
			} else {
				this.$checkBtn.dataset.hidden = 'true';
			}
		}) as EventListener);

		// Complete - interaction submitted
		this.interaction.addEventListener('interaction:complete', ((e: CustomEvent) => {
			console.log('[Shell] Interaction complete:', e.detail);
			this.stopTimer();
			this.handleCompletion(e.detail.state);
		}) as EventListener);

		// Hint shown
		this.interaction.addEventListener('interaction:hint-shown', ((e: CustomEvent) => {
			console.log('[Shell] Hint shown:', e.detail.message);
		}) as EventListener);

		// Error
		this.interaction.addEventListener('interaction:error', ((e: CustomEvent) => {
			console.error('[Shell] Interaction error:', e.detail);
			alert(e.detail.message);
		}) as EventListener);
	}

	private removeInteractionListeners(): void {
		// Events automatically cleaned up when interaction is removed from DOM
	}

	// ==================== UI UPDATES ====================

	private updateProgress(current: number, total: number): void {
		this.$progressBar.max = total;
		this.$progressBar.value = current;
	}

	private handleCompletion(state: any): void {
		// Dispatch completion event for external handlers
		this.dispatchEvent(new CustomEvent('shell:interaction-complete', {
			detail: { state },
			bubbles: true,
			composed: true
		}));

		// Disable check button after submission
		this.$checkBtn.disabled = true;
		this.$checkBtn.textContent = '✓ Submitted';

		// Could show results, grade, etc. here
		console.log('[Shell] Interaction submitted with state:', state);
	}

	// ==================== TIMER MANAGEMENT ====================

	private initTimer(): void {
		this.stopTimer();

		const timerSeconds = parseInt(this.getAttribute('timer') ?? '0', 10);

		if (timerSeconds === 0) {
			this.$timerEl.dataset.hidden = 'true';
			return;
		}

		this.$timerEl.dataset.hidden = 'false';
		this.remainingSeconds = timerSeconds;

		if (timerSeconds < 30) {
			console.warn(`Timer set to ${timerSeconds}s - may be too short`);
		}

		this.updateTimerDisplay();
		this.startTimer();
	}

	private startTimer(): void {
		this.timerInterval = window.setInterval(() => {
			this.remainingSeconds--;
			this.updateTimerDisplay();

			if (this.remainingSeconds <= 0) {
				this.stopTimer();
				this.handleTimerComplete();
			}
		}, 1000);
	}

	private stopTimer(): void {
		if (this.timerInterval !== null) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	}

	private updateTimerDisplay(): void {
		const minutes = Math.floor(this.remainingSeconds / 60);
		const seconds = this.remainingSeconds % 60;
		const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
		this.$timerEl.textContent = display;

		// Update warning states
		delete this.$timerEl.dataset.warning;
		delete this.$timerEl.dataset.danger;

		if (this.remainingSeconds <= 10) {
			this.$timerEl.dataset.danger = 'true';
		} else if (this.remainingSeconds <= 30) {
			this.$timerEl.dataset.warning = 'true';
		}
	}

	private handleTimerComplete(): void {
		console.log('[Shell] Timer complete');

		// Auto-submit if interaction is complete
		if (this.interaction && this.interactionComplete) {
			try {
				this.interaction.submit();
			} catch (error) {
				console.error('Auto-submit on timer failed:', error);
			}
		}

		// Dispatch timer complete event
		this.dispatchEvent(new CustomEvent('shell:timer-complete', {
			bubbles: true,
			composed: true
		}));
	}

	public pauseTimer(): void {
		this.stopTimer();
	}

	public resumeTimer(): void {
		if (this.remainingSeconds > 0 && this.timerInterval === null) {
			this.startTimer();
		}
	}

	public resetTimer(): void {
		const timerSeconds = parseInt(this.getAttribute('timer') ?? '0', 10);
		this.remainingSeconds = timerSeconds;
		this.updateTimerDisplay();
	}

	// ==================== DISPLAY UPDATES ====================

	private updateVisibility(): void {
		const showHeader = this.getAttribute('show-header') !== 'false';
		const showFooter = this.getAttribute('show-footer') !== 'false';

		this.$headerEl.style.display = showHeader ? '' : 'none';
		this.$footerEl.style.display = showFooter ? '' : 'none';
	}

	private updateFooterMode(): void {
		const mode = this.getAttribute('footer-mode') ?? 'static';

		if (mode === 'sequential') {
			this.$checkBtn.dataset.hidden = 'true';
			this.$radioNav.dataset.active = 'true';
			this.renderRadioNav();
		} else {
			this.$radioNav.dataset.active = 'false';
			// Check button visibility handled by interaction events
		}
	}

	private renderRadioNav(): void {
		let count = parseInt(this.getAttribute('radio-count') ?? '3', 10);
		this.$radioNav.innerHTML = '';

		if (this.interaction) {
			// count = this.interaction.slidesNumber;
		}

		for (let i = 1; i <= count; i++) {
			const input = document.createElement('input');
			input.type = 'radio';
			input.name = 'step-nav';
			input.id = `step-${i}`;
			if (i === 1) input.checked = true;

			const label = document.createElement('label');
			label.htmlFor = `step-${i}`;
			label.textContent = String(i);

			this.$radioNav.appendChild(input);
			this.$radioNav.appendChild(label);
		}
	}

	private sync(): void {
		const heading = this.getAttribute('heading') ?? '';
		this.$titleEl.textContent = heading;

		this.updateVisibility();
		this.updateFooterMode();
	}

	// ==================== PUBLIC API ====================

	public getContentArea(): HTMLElement {
		return this.$contentEl;
	}

	public showCheckButton(): void {
		this.$checkBtn.dataset.hidden = 'false';
	}

	public hideCheckButton(): void {
		this.$checkBtn.dataset.hidden = 'true';
	}
}

if (!customElements.get('edu-window')) {
	customElements.define('edu-window', InteractionsBaseShell);
}
