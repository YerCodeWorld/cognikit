// import { Variant } from "../shared";
import HTML from './index.html';

export class EduApplicationWindow extends HTMLElement {

	static get observedAttributes() {
		return [
			'variant',
			'heading',
			'footer',
			'show-header',
			'show-footer',
			'footer-mode',
			'timer',
			'radio-count',
			'progress'
		];
	}

	private $titleEl!: HTMLElement;
	private $timerEl!: HTMLElement;
	private $headerEl!: HTMLElement;
	private $footerEl!: HTMLElement;
	private $wrapEl!: HTMLElement;
	private $styleEl!: HTMLStyleElement;
	private $checkBtn!: HTMLButtonElement;
	private $radioNav!: HTMLElement;
	private $progressBar!: HTMLProgressElement;

	private timerInterval: number | null = null;
	private remainingSeconds: number = 0;

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });

		this.$styleEl = document.createElement('style');
		this.shadowRoot.append(this.$styleEl);

		const wrap = document.createElement('section');
		wrap.className = "wrap";
		wrap.innerHTML = HTML;

		this.shadowRoot.append(wrap);
		this.$wrapEl = wrap;
		this.$headerEl = wrap.querySelector('header');
		this.$titleEl = wrap.querySelector('.title');
		this.$timerEl = wrap.querySelector('.timer');
		this.$footerEl = wrap.querySelector('#footer');
		this.$checkBtn = wrap.querySelector('.check-btn');
		this.$radioNav = wrap.querySelector('.radio-nav');
		this.$progressBar = wrap.querySelector('.progress-bar');
	}

	public getFooter(): HTMLElement { return this.$footerEl; }
	public getCheckBtn(): HTMLButtonElement { return this.$checkBtn; }
	public getRadioNav(): HTMLElement { return this.$radioNav; }
	public getTimer(): HTMLElement { return this.$timerEl; }
	public getProgressBar(): HTMLProgressElement { return this.$progressBar; }

	private currentProgress: number = 0;
	private totalProgress: number = 100;

	public setTotal(total: number) {
		this.totalProgress = total;
		this.$progressBar.max = total;
		this.updateProgressBar();
	}

	public increment() {
		this.currentProgress++;
		this.updateProgressBar();
	}

	public decrement() {
		if (this.currentProgress > 0) {
			this.currentProgress--;
		}
		this.updateProgressBar();
	}

	public setProgress(current: number, max: number = 100) {
		this.currentProgress = current;
		this.totalProgress = max;
		this.$progressBar.max = max;
		this.updateProgressBar();
	}

	public resetProgress() {
		this.currentProgress = 0;
		this.updateProgressBar();
	}

	private updateProgressBar() {
		this.$progressBar.value = this.currentProgress;
	}

	public showCheckButton() {
		this.$checkBtn.dataset.hidden = 'false';
	}

	public hideCheckButton() {
		this.$checkBtn.dataset.hidden = 'true';
	}

	connectedCallback() {
		if (!this.hasAttribute("variant")) this.setAttribute("variant", "elegant");
		if (!this.hasAttribute("show-header")) this.setAttribute("show-header", "true");
		if (!this.hasAttribute("show-footer")) this.setAttribute("show-footer", "true");
		if (!this.hasAttribute("footer-mode")) this.setAttribute("footer-mode", "static");
		if (!this.hasAttribute("timer")) this.setAttribute("timer", "0");
		if (!this.hasAttribute("progress")) this.setAttribute("progress", "0");

		this.sync();

		// Initially hide check button, show progress
		this.$checkBtn.dataset.hidden = 'true';
	}

	disconnectedCallback() {
		this.stopTimer();
	}

	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if (oldValue === newValue) return;

		if (name === 'timer') {
			this.initTimer();
		}

		this.sync();
	}

	private updateVisibility() {
		const showHeader = this.getAttribute('show-header') !== 'false';
		const showFooter = this.getAttribute('show-footer') !== 'false';

		this.$headerEl.style.display = showHeader ? '' : 'none';
		this.$footerEl.style.display = showFooter ? '' : 'none';
	}

	private updateFooterMode() {
		const mode = this.getAttribute('footer-mode') ?? 'static';

		if (mode === 'sequential') {
			this.$checkBtn.dataset.hidden = 'true';
			this.$radioNav.dataset.active = 'true';
			this.renderRadioNav();
		} else {
			this.$checkBtn.dataset.hidden = 'false';
			this.$radioNav.dataset.active = 'false';
		}
	}

	private renderRadioNav() {
		const count = parseInt(this.getAttribute('radio-count') ?? '3', 10);
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

	private initTimer() {
		this.stopTimer();

		const timerSeconds = parseInt(this.getAttribute('timer') ?? '0', 10);

		if (timerSeconds === 0) {
			this.$timerEl.dataset.hidden = 'true';
			return;
		}

		this.$timerEl.dataset.hidden = 'false';
		this.remainingSeconds = timerSeconds;

		// Alert if timer is too low (< 30 seconds)
		if (timerSeconds < 30) {
			console.warn(`Timer is set to ${timerSeconds} seconds, which may be too short for users to complete the task.`);
		}

		this.updateTimerDisplay();
		this.startTimer();
	}

	private startTimer() {
		this.timerInterval = window.setInterval(() => {
			this.remainingSeconds--;
			this.updateTimerDisplay();

			if (this.remainingSeconds <= 0) {
				this.stopTimer();
				this.dispatchEvent(new CustomEvent('timer-complete', { bubbles: true, composed: true }));
			}
		}, 1000);
	}

	private stopTimer() {
		if (this.timerInterval !== null) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	}

	private updateTimerDisplay() {
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

	public pauseTimer() {
		this.stopTimer();
	}

	public resumeTimer() {
		if (this.remainingSeconds > 0 && this.timerInterval === null) {
			this.startTimer();
		}
	}

	public resetTimer() {
		const timerSeconds = parseInt(this.getAttribute('timer') ?? '0', 10);
		this.remainingSeconds = timerSeconds;
		this.updateTimerDisplay();
	}

	private sync() {
		const heading = this.getAttribute('heading') ?? '';
		this.$titleEl.textContent = heading;

		this.updateVisibility();
		this.updateFooterMode();
	}
}

if (!customElements.get('edu-window')) customElements.define('edu-window', EduApplicationWindow);
