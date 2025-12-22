import { EduApplicationWindow } from "../shell";
import { IInteractionInstance, InteractionConfig, InteractionOptions, ItemData, InteractionResult } from "../shared";

export abstract class BaseInteraction<T extends ItemData>
	implements IInteractionInstance {

	public readonly id: string;

	protected readonly mount: HTMLElement;
	protected readonly data: T;
	protected readonly config: InteractionConfig;
	protected readonly shell: EduApplicationWindow;
	protected readonly interactionHandler?: (r: InteractionResult) => void;

	// Track progress
	private progressTotal: number = 0;
	private progressCurrent: number = 0;

	constructor(options: InteractionOptions<T>) {

		this.id = crypto.randomUUID();
		this.mount = options.mount;
		this.data = options.data;
		this.config = options.config;
		this.interactionHandler = options.interactionHandler;

		this.shell = document.createElement("edu-window") as EduApplicationWindow;

		this.setupShell();
		this.setupEventListeners();

		this.mount.appendChild(this.shell);

		requestAnimationFrame(() => {
			this.render();
		});
	}

	private setupShell(): void {
		this.shell.setAttribute("variant", this.config.variant ?? 'outline');
		this.shell.setAttribute("heading", this.config.prompt ?? 'No prompt');
		this.shell.setAttribute("show-header", this.config.headerEnabled ? 'true' : 'false');
		this.shell.setAttribute("show-footer", this.config.footerEnabled ? 'true' : 'false');

		if (this.config.timer && this.config.timer > 0) {
			this.shell.setAttribute("timer", String(this.config.timer));
		}

		const footerMode = this.config.footerAction === 'navigation' ? 'sequential' : 'static';
		this.shell.setAttribute("footer-mode", footerMode);

		if (this.config.footerAction === 'navigation') {
			// Default to reasonable count, can be overridden by child classes
			this.shell.setAttribute("radio-count", "5");
		}
	}

	private setupEventListeners(): void {
		// Check button click handler
		this.shell.addEventListener('click', (e) => {
			const checkBtn = this.shell.getCheckBtn();
			if (e.composedPath().includes(checkBtn)) {
				this.onCheckButtonClick();
			}
		});

		// Timer complete handler
		this.shell.addEventListener('timer-complete', () => {
			this.onTimerComplete();
		});

		// Radio navigation handler
		this.shell.addEventListener('click', (e) => {
			const radioNav = this.shell.getRadioNav();
			const clickedLabel = e.composedPath().find(
				el => (el as HTMLElement).tagName === 'LABEL' &&
				(el as HTMLElement).parentElement === radioNav
			) as HTMLLabelElement | undefined;

			if (clickedLabel) {
				const inputId = clickedLabel.getAttribute('for');
				const match = inputId?.match(/step-(\d+)/);
				if (match) {
					const stepIndex = parseInt(match[1], 10);
					this.onNavigationChange(stepIndex);
				}
			}
		});
	}

	// ==================== ABSTRACT METHODS ====================
	abstract render(): void;
	abstract getCurrentState(): any;
	abstract isInteractionComplete(): boolean;

	// ==================== LIFECYCLE HOOKS ====================
	protected onCheckButtonClick(): void {
		// Default: submit for scoring
		this.submitForScoring();
		this.shell.stopTimer();
	}

	protected onTimerComplete(): void {
		// Default: auto-submit when time's up
		console.log(`Timer complete for interaction ${this.id}`);
		this.submitForScoring();
	}

	protected onNavigationChange(stepIndex: number): void {
		// Override in child class to handle step changes
		console.log(`Navigation changed to step ${stepIndex}`);
	}

	// ==================== PROGRESS ====================
	/**
	 * Initialize progress tracking with a total count
	 */
	protected initializeProgress(total: number): void {
		this.progressTotal = total;
		this.progressCurrent = 0;
		this.shell.setTotal(total);
	}

	/**
	 * Update progress by setting current value
	 */
	protected updateProgress(current: number): void {
		this.progressCurrent = current;
		this.shell.setProgress(current, this.progressTotal);
	}

	protected incrementProgress(): void {
		this.shell.increment();
		this.progressCurrent++;
		// not all use cases might want this i guess, so let's just add this flag
		if ((this.progressCurrent === this.progressTotal) && this.config.autoCheckButton) {
			this.showCheckButton();
		} 
	}

	protected decrementProgress(): void {
		this.shell.decrement();
		this.progressCurrent--;
		this.hideCheckButton();
	}

	/**
	 * Reset progress to 0
	 */
	protected resetProgress(): void {
		this.progressCurrent = 0;
		this.shell.resetProgress();
	}

	/**
	 * Get current progress values
	 */
	protected getProgress(): { current: number; total: number } {
		return {
			current: this.progressCurrent,
			total: this.progressTotal
		};
	}

	// ==================== SHELL HELPERS ====================

	protected setNavigationSteps(count: number): void {
		this.shell.setAttribute('radio-count', String(count));
	}

	/**
	 * Need for showing only when progress is complete
	 */
	protected showCheckButton(): void {
		this.shell.showCheckButton();
	}

	protected hideCheckButton(): void {
		this.shell.hideCheckButton();
	}

	protected enableCheckButton(): void {
		this.shell.getCheckBtn().disabled = false;
	}

	protected disableCheckButton(): void {
		this.shell.getCheckBtn().disabled = true;
	}

	protected pauseTimer(): void {
		this.shell.pauseTimer();
	}

	protected resumeTimer(): void {
		this.shell.resumeTimer();
	}

	protected resetTimer(): void {
		this.shell.resetTimer();
	}

	/**
	 * Get access to the shell's content area for rendering
	 */
	protected getContentArea(): HTMLElement {
		const shadowRoot = this.shell.shadowRoot;
		if (!shadowRoot) {
			throw new Error('Shadow root not available on shell element');
		}
		const content = shadowRoot.querySelector('[part="content"]') as HTMLElement;
		if (!content) {
			throw new Error('Content area not found in shell shadow DOM');
		}
		return content;
	}

	// ==================== SCORING ====================

	/**
	 * Submit the interaction for scoring
	 * Override this in child classes to implement scoring logic
	 */
	protected submitForScoring(): void {
		const state = this.getCurrentState();
		const isComplete = this.isInteractionComplete();

		if (!isComplete) {
			console.warn(`Interaction ${this.id} submitted but not complete`);
		}

		if (this.interactionHandler) {
			// TODO: Determine result based on scoring logic
			// For now, just call with a placeholder
			this.interactionHandler('a');
		}

		console.log('Submitted for scoring:', { id: this.id, state, isComplete });
	}

	public reset(): void {
		this.resetProgress();
		this.resetTimer();
		this.render();
	}

	public setVariant(variant: Variant): void {
		this.config.variant = variant;
		this.shell.setAttribute('variant', variant);
		this.render();
	}

	public destroy(): void {
		this.mount.innerHTML = '';
	}

}
