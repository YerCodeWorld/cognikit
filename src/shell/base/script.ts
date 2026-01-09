import HTML from './index.html';
import CSS from './styles.css';

import { BaseInteraction } from "../../core/BaseInteraction";
import { Variant } from "../../shared";
import { InteractionData } from "../../types/Data";
import { SoundManager, AnimationsManager } from "../../shared/managers";

export class InteractionsBaseShell extends HTMLElement {

	static get observedAttributes() {
		return ['show-header', 'show-footer'];
	}

	private soundManager: SoundManager = new SoundManager();
	private animationsManager: AnimationsManager = new AnimationsManager();

	// ==================== DOM ELEMENTS ====================
	private $titleEl!: HTMLElement;
	private $promptBtn!: HTMLButtonElement;
	private $timerEl!: HTMLElement;

	private $headerEl!: HTMLElement;
	private $footerEl!: HTMLElement;

	private $contentEl!: HTMLElement;

	private $checkBtn!: HTMLButtonElement;
	private $seeAnswersBtn!: HTMLButtonElement;
	private $scoresBtn!: HTMLButtonElement;
	private $retryBtn!: HTMLButtonElement;

	private $radioNav!: HTMLElement;

	private $progressContainer!: HTMLDivElement;
	private $progressBar!: HTMLProgressElement;
	private $progressIcon!: HTMLImageElement;
	private $progressCounter!: HTMLSpanElement;

	// Screen elements
	private $interactionScreen!: HTMLElement;
	private $errorContent!: HTMLElement;
	private $attemptsMessage!: HTMLElement;
	private $scoreDisplay!: HTMLElement;

	// ==================== STATE ====================
	private interaction?: BaseInteraction<any>;
	private timerInterval: number | null = null;
	private remainingSeconds: number = 0;
	private interactionComplete = false;
	private attemptCount: number = 0;
	private attemptLimit: number | null = null;

	private currentScreen: 'interaction' | 'error' | 'solution' | 'attempts' | 'score' = 'interaction';

	// ==================== CONSTRUCTOR ====================

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });

		const style = document.createElement('style');
		style.textContent = CSS;
		this.shadowRoot!.append(style);

		const wrap = document.createElement('section');
		wrap.className = "wrap";
		wrap.innerHTML = HTML;
		this.shadowRoot!.append(wrap);

		AnimationsManager.injectKeyframes(this.shadowRoot);

		// Cache
		this.$headerEl = wrap.querySelector('header')!;
		this.$footerEl = wrap.querySelector('footer')!;

		this.$titleEl = wrap.querySelector('.title')!;
		this.$promptBtn = wrap.querySelector('.prompt-btn');
		this.$timerEl = wrap.querySelector('.timer')!;
		this.$checkBtn = wrap.querySelector('.check-btn')!;
		this.$scoresBtn = wrap.querySelector('.scores-btn');
		this.$seeAnswersBtn = wrap.querySelector('.see-answers-btn')!;
		this.$retryBtn = wrap.querySelector('.retry-btn')!;
		this.$radioNav = wrap.querySelector('.radio-nav')!;
		this.$progressContainer = wrap.querySelector('.progress-container');
		this.$progressBar = wrap.querySelector('.progress-bar')!;
		this.$progressIcon = wrap.querySelector('.progress-icon-wrapper')!;
		this.$progressCounter = wrap.querySelector('.progress-counter')!;
		this.$contentEl = wrap.querySelector('[part="content"]')!;
		this.$interactionScreen = wrap.querySelector('[data-screen="interaction"]')!;
		
		this.animationsManager.isEnabled = true; 

		// Cache
		this.$errorContent = wrap.querySelector('.error-content')!;
		this.$attemptsMessage = wrap.querySelector('.attempts-message')!;
		this.$scoreDisplay = wrap.querySelector('.score-display')!;

		this.setupShellListeners();
}

	// ==================== LIFECYCLE ====================
	connectedCallback() {
		if (!this.hasAttribute("show-header")) this.setAttribute("show-header", "true");
		if (!this.hasAttribute("show-footer")) this.setAttribute("show-footer", "true");

		this.updateVisibility();

		this.animationsManager.animate(this.$progressIcon, 'heartbeat');
		this.animationsManager.animate(this.$promptBtn, 'wobble');
	}

	disconnectedCallback() {
		this.stopTimer();
		this.removeInteractionListeners();
	}

	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if (oldValue === newValue) return;
		this.updateVisibility();
	}

	// ==================== INTERACTION MANAGEMENT ====================
	public setInteraction<T extends InteractionData>(interaction: BaseInteraction<T>): void {
		
		this.stopTimer();

		if (!interaction.isValid) {
			this.$errorContent.textContent = interaction.errors ?? 'Error loading the interaction.';
			this.switchScreen('error');
			return;
		}

		this.soundManager.playSound('start');
		
		if (this.interaction) {
			this.removeInteractionListeners();
			this.$interactionScreen.innerHTML = '';
		}
		
		this.interaction = interaction;
		this.interactionComplete = false;
		const cfg = this.interaction.config;

		this.reset();
		this.switchScreen('interaction');
		
		const variant = cfg.variant ?? 'elegant';
		this.setAttribute('variant', variant);
		this.interaction.onVariantChange(variant);

		this.$titleEl.textContent = cfg.prompt || '';
		if (cfg.promptData && cfg.promptModality) {
			this.$titleEl.style.cursor = 'pointer';
			this.$titleEl.style.textDecoration = 'underline';
			this.$titleEl.title = 'Click to view prompt details';

			this.$promptBtn.addEventListener('click', () => this.openPromptDialog());
			this.$titleEl.addEventListener('click', () => this.openPromptDialog());
		} else {
			this.$titleEl.style.cursor = '';
			this.$titleEl.style.textDecoration = '';
			this.$titleEl.title = '';
		}
		
		// render error screen if time too low?
		if (cfg.timer !== null && cfg.timer > 30) {
			this.remainingSeconds = cfg.timer;
			this.$timerEl.dataset.hidden = 'false';
			this.updateTimerDisplay();
			this.startTimer();
		} else this.$timerEl.dataset.hidden = 'true';

		this.attemptLimit = cfg.attemptLimit;
		this.attemptCount = 0;

		if (this.interaction.interactionMechanic === 'sequential') {
			this.$radioNav.dataset.active = 'true';
			this.$checkBtn.dataset.hidden = 'true';
			this.renderRadioNav();
		} else this.$radioNav.dataset.active = 'false';

		if (!this.interaction.implementsProgress) {
			this.$progressContainer.style.display = "none";
			this.$checkBtn.dataset.hidden = "false";
		} else {
			this.$checkBtn.dataset.hidden = "true";
			this.$progressContainer.style.display = "inline-flex";
			this.$progressCounter.textContent = `0/${this.interaction.progressTracker.total}`;
		}

		this.setupInteractionListeners();

		this.$interactionScreen.innerHTML = '';
		this.$interactionScreen.appendChild(interaction);
	}

	public removeInteraction(): void {
		if (this.interaction) {
			this.removeInteractionListeners();
			this.$interactionScreen.innerHTML = '';
			this.interaction = undefined;
			this.interactionComplete = false;
		}
	}

	// ==================== EVENT LISTENERS ====================
	private setupShellListeners(): void {
		this.$checkBtn.addEventListener('click', () => {
			this.soundManager.playSound('pop');
			try {
				this.interaction.submit();
			} catch (error) {
				console.error('Submit failed:', error);
			}
		});

		this.$seeAnswersBtn.addEventListener('click', () => {
			this.soundManager.playSound('pop');
			if (this.currentScreen === 'solution') this.switchScreen('interaction');
			else this.switchScreen('solution');
		});

		this.$scoresBtn.addEventListener('click', () => {
			this.soundManager.playSound('pop');
			if (this.currentScreen === 'score') this.switchScreen('interaction');
			else this.switchScreen('score');
		});

		this.$retryBtn.addEventListener('click', () => this.handleRetry());

		this.$radioNav.addEventListener('change', (e) => {
			const target = e.target as HTMLInputElement;

			if (target.type === 'radio') {
				const stepIndex = parseInt(target.id.replace('step-', ''), 10);

				if (this.interaction) this.interaction.setSteps(stepIndex);

				this.dispatchEvent(new CustomEvent('navigation-change', {
					detail: { step: stepIndex },
					bubbles: true,
					composed: true
				}));
			}
		});
	}
	
	private setupInteractionListeners(): void {

		this.interaction.addEventListener('interaction:ready', ((e: CustomEvent) => {
			console.log('[Shell] Interaction ready:', e.detail.id);
		}) as EventListener);

		this.interaction.addEventListener('interaction:progress', ((e: CustomEvent) => {
			const { current, total, percentage } = e.detail;
			this.updateProgress(current, total);

			if (current === total && total > 0) {
				this.interactionComplete = true;
				this.$checkBtn.dataset.hidden = 'false';
			} else {
				this.interactionComplete = false;
				this.$checkBtn.dataset.hidden = 'true';
			}
		}) as EventListener);

		this.interaction.addEventListener('interaction:complete', ((e: CustomEvent) => {
			console.log('[Shell] Interaction complete:', e.detail);
			this.stopTimer();
			this.handleCompletion(e.detail.state);
		}) as EventListener);

		this.interaction.addEventListener('interaction:graded', ((e: CustomEvent) => {
			if (e.detail.result.score === 100) {
				this.soundManager.playSound('success');	
				this.animationsManager.animate(this.$progressIcon, 'spin-pulse');
			} else {
				this.soundManager.playSound('failure');
				this.animationsManager.animate(this.$progressIcon, 'shake');
			};

			this.handleGraded(e.detail.result);
		}) as EventListener);

		this.interaction.addEventListener('interaction:hint-shown', ((e: CustomEvent) => {
			console.log('[Shell] Hint shown:', e.detail.message);
		}) as EventListener);

		this.interaction.addEventListener('interaction:error', ((e: CustomEvent) => {
			console.error('[Shell] Interaction error:', e.detail);
			alert(e.detail.message);
		}) as EventListener);
	}

	private removeInteractionListeners(): void {}

	// ==================== UI UPDATES ====================

	private updateProgress(current: number, total: number): void {
		this.$progressBar.max = total;
		this.$progressBar.value = current ?? 0;

		this.$progressCounter.textContent = `${current}/${total}`;

		const percentage = total > 0 ? (current / total) * 100 : 0;
		const progressBarWidth = this.$progressBar.offsetWidth;
		const iconPosition = (progressBarWidth * percentage) / 100 - 12; // Center icon on tip
		this.$progressIcon.style.left = `${Math.max(0, iconPosition)}px`;
	}

	private handleCompletion(state: any): void {
		this.dispatchEvent(new CustomEvent('shell:interaction-complete', {
			detail: { state },
			bubbles: true,
			composed: true
		}));
		console.log('[Shell] Interaction submitted with state:', state);
	}

	private handleGraded(result: any): void {

		this.$checkBtn.dataset.hidden = 'true';

		this.$seeAnswersBtn.dataset.hidden = 'false';
		this.$scoresBtn.dataset.hidden = 'false';

		if (!this.attemptLimit || this.attemptCount < this.attemptLimit) {
			this.$retryBtn.dataset.hidden = 'false';
		}

		const score = result.score;
		this.$scoreDisplay.innerHTML = `
			<div style="font-size: 4rem; font-weight: 700; color: ${score >= 75 ? 'rgb(var(--edu-success))' : score >= 50 ? 'rgba(139, 195, 74)' : score >= 25 ? 'rgb(var(--edu-warning))' : 'rgb(var(--edu-error))'}">${score}%</div>
			<div style="font-size: 1.5rem; margin-top: 1rem; color: rgb(var(--edu-second-ink));">
				${score === 100 ? 'Perfect Score! 🎉' : score >= 75 ? 'Great Job!' : score >= 50 ? 'Good Effort!' : score >= 25 ? 'Keep Trying!' : 'Try Again!'}
			</div>
		`;

		this.$progressIcon.classList.remove('score-fail', 'score-low', 'score-mid', 'score-high');
		this.$progressBar.classList.remove('score-fail', 'score-low', 'score-mid', 'score-high');

		let scoreClass = '';
		if (score <= 25) {
			scoreClass = 'score-fail';
		} else if (score <= 50) {
			scoreClass = 'score-low';
		} else if (score <= 75) {
			scoreClass = 'score-mid';
		} else {
			scoreClass = 'score-high';
		}

		this.$progressIcon.classList.add(scoreClass);
		this.$progressBar.classList.add(scoreClass);
	}

	private reset() {
		this.resetTimer();

		this.$seeAnswersBtn.dataset.hidden = 'true';
		this.$retryBtn.dataset.hidden = 'true';
		this.$scoresBtn.dataset.hidden = 'true';

		this.$progressIcon.classList.remove('score-fail', 'score-low', 'score-mid', 'score-high');
		this.$progressBar.classList.remove('score-fail', 'score-low', 'score-mid', 'score-high');

		this.animationsManager.stop(this.$progressIcon);

		this.$progressBar.value = 0;
		this.updateProgress(0, this.interaction.progressTracker.total);
	}

	private handleRetry(): void {

		this.$retryBtn.dataset.hidden = 'true';

		this.soundManager.playSound('pop');
		this.attemptCount++;

		if (this.attemptLimit && this.attemptLimit > 0) {
			const remaining = this.attemptLimit - this.attemptCount + 1;

			this.$attemptsMessage.textContent = `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining`;
			this.switchScreen('attempts');

			setTimeout(() => {
				this.switchScreen('interaction');
				this.reset();
				this.resumeTimer();
				this.interaction?.reset();
				this.soundManager.playSound('flip');
			}, 2000);
		} else {
			this.switchScreen('interaction');
			this.interaction?.reset();
		}
	}

	private openPromptDialog(): void {
		const config = this.interaction?.config;
		if (!config) return;

		this.soundManager.playSound('pop');

		let dialog = document.querySelector('edu-dialog#prompt-dialog') as any;
		if (!dialog) {
			dialog = document.createElement('edu-dialog');
			dialog.id = 'prompt-dialog';
			document.body.appendChild(dialog);
		}

		dialog.title = config.construct || this.interaction?.config.promptModality || 'Prompt';

		const media = document.createElement('edu-media');
		media.setAttribute('type', config.promptModality!);
		media.setAttribute('data', config.promptData!);
		if (config.promptDataSpec) {
			media.setAttribute('spec', config.promptDataSpec);
		}

		dialog.innerHTML = '';
		dialog.appendChild(media);
		dialog.open();
	}

	// ==================== SCREEN MANAGEMENT ====================

	private switchScreen(screenName: 'interaction' | 'error' | 'solution' | 'attempts' | 'score'): void {
		this.shadowRoot!.querySelectorAll('.screen').forEach(screen => {
			const name = screen.getAttribute('data-screen');
			(screen as HTMLElement).style.display = name === screenName ? 'block' : 'none';
		});

		this.currentScreen = screenName;
		console.log(`[Shell] Switched to screen: ${screenName}`);
	}

	// ==================== TIMER MANAGEMENT ====================

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
		this.$timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

		if (this.remainingSeconds === 30) {
			this.soundManager.playSound('low-time');
			this.animationsManager.animate(this.$timerEl, 'shake')
		}

		delete this.$timerEl.dataset.warning;
		delete this.$timerEl.dataset.danger;

		if (this.remainingSeconds <= 10) this.$timerEl.dataset.danger = 'true';
		else if (this.remainingSeconds <= 30) this.$timerEl.dataset.warning = 'true';
	}

	private handleTimerComplete(): void {
		console.log('[Shell] Timer complete');

		try {
			this.interaction.submit();
		} catch (error) {
			console.error('Auto-submit on timer failed:', error);
		}

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
		this.stopTimer();
		this.remainingSeconds = this.interaction.config.timer;
		this.updateTimerDisplay();
	}

	// ==================== DISPLAY UPDATES ====================

	private updateVisibility(): void {
		const showHeader = this.getAttribute('show-header') !== 'false';
		const showFooter = this.getAttribute('show-footer') !== 'false';

		this.$headerEl.style.display = showHeader ? '' : 'none';
		this.$footerEl.style.display = showFooter ? '' : 'none';
	}

	private renderRadioNav(): void {
		const count = this.interaction && 'slidesCount' in this.interaction
			? (this.interaction as any).slidesCount
			: 1;

		this.$radioNav.innerHTML = '';

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

	// ==================== PUBLIC API ====================

	public getContentArea(): HTMLElement {
		return this.$contentEl;
	}
}

if (!customElements.get('edu-window')) {
	customElements.define('edu-window', InteractionsBaseShell);
}
