import { ProgressTracker } from "./utilities/ProgressTracker";
import { ItemData, InteractionConfig, Variant } from "../shared";

/**
 * Standard events emitted by all interactions
 * Shells and external systems can listen to these
 */
export type InteractionEventMap = {
	'interaction:ready': CustomEvent<{ id: string }>;
	'interaction:progress': CustomEvent<{ current: number; total: number; percentage: number }>;
	'interaction:state-change': CustomEvent<{ state: any; isComplete: boolean }>;
	'interaction:complete': CustomEvent<{ state: any; id: string }>;
	'interaction:hint-shown': CustomEvent<{ message?: string }>;
	'interaction:error': CustomEvent<{ error: Error; message: string }>;
};

export abstract class BaseInteraction<T extends ItemData> extends HTMLElement {

	// ==================== PROPERTIES ====================

	/** Unique identifier for this interaction instance */
	public readonly id: string;

	/** Data for this interaction (questions, answers, etc.) */
	protected data: T;

	/** Configuration (variant, timer, etc.) */
	protected config: InteractionConfig;

	/** Progress tracking utility */
	protected progressTracker: ProgressTracker;

	/** Whether the interaction has been initialized */
	private _initialized = false;

	// ==================== CONSTRUCTOR ====================

	constructor(data: T, config: InteractionConfig) {
		super();

		this.id = crypto.randomUUID();
		this.data = data;
		this.config = config;
		this.progressTracker = new ProgressTracker();

		// Set variant attribute for styling
		if (config.variant) {
			this.setAttribute('variant', config.variant);
		}
	}

	// ==================== LIFECYCLE (Web Component) ====================

	connectedCallback() {
		if (!this._initialized) {
			this._initialized = true;
			this.initialize();
			requestAnimationFrame(() => {
				this.render();
				this.emitReady();
			});
		}
	}

	disconnectedCallback() {
		this.cleanup();
	}

	// ==================== ABSTRACT METHODS (Must Implement) ====================

	/**
	 * Render the interaction's UI
	 * Called automatically after connectedCallback
	 */
	abstract render(): void;

	/**
	 * Get the current state/response from the user
	 * @returns User's current answers/selections
	 */
	abstract getCurrentState(): any;

	/**
	 * Check if the interaction is complete
	 * @returns true if user has provided all required responses
	 */
	abstract isInteractionComplete(): boolean;

	/**
	 * Provide a hint to the user
	 * Implementation is interaction-specific
	 */
	abstract onHint(): void;

	// ==================== OPTIONAL LIFECYCLE HOOKS ====================

	/**
	 * Called once when interaction is first connected to DOM
	 * Override to set up event listeners, initialize state, etc.
	 */
	protected initialize(): void {
		// Override in subclass if needed
	}

	/**
	 * Called when interaction is removed from DOM
	 * Override to clean up event listeners, timers, etc.
	 */
	protected cleanup(): void {
		// Override in subclass if needed
	}

	/**
	 * Called when variant changes
	 * Override to update interaction styling
	 */
	protected onVariantChange(newVariant: Variant): void {
		// Override in subclass if needed
	}

	// ==================== PROGRESS TRACKING ====================

	/**
	 * Initialize progress tracking with total number of steps/items
	 */
	protected initializeProgress(total: number): void {
		this.progressTracker.initialize(total);
		this.emitProgress();
	}

	/**
	 * Set current progress value
	 */
	protected setProgress(current: number): void {
		this.progressTracker.setCurrent(current);
		this.emitProgress();
	}

	/**
	 * Increment progress by 1
	 */
	protected incrementProgress(): void {
		this.progressTracker.increment();
		this.emitProgress();
	}

	/**
	 * Decrement progress by 1
	 */
	protected decrementProgress(): void {
		this.progressTracker.decrement();
		this.emitProgress();
	}

	/**
	 * Get current progress information
	 */
	protected getProgress(): { current: number; total: number; percentage: number } {
		return {
			current: this.progressTracker.current,
			total: this.progressTracker.total,
			percentage: this.progressTracker.getPercentage()
		};
	}

	// ==================== EVENT EMISSION (Communication) ====================

	/**
	 * Emit ready event (interaction initialized and rendered)
	 */
	private emitReady(): void {
		this.dispatchEvent(new CustomEvent('interaction:ready', {
			detail: { id: this.id },
			bubbles: true,
			composed: true
		}));
	}

	/**
	 * Emit progress update event
	 */
	protected emitProgress(): void {
		const progress = this.getProgress();
		this.dispatchEvent(new CustomEvent('interaction:progress', {
			detail: progress,
			bubbles: true,
			composed: true
		}));
	}

	/**
	 * Emit state change event (user modified their response)
	 */
	protected emitStateChange(): void {
		this.dispatchEvent(new CustomEvent('interaction:state-change', {
			detail: {
				state: this.getCurrentState(),
				isComplete: this.isInteractionComplete()
			},
			bubbles: true,
			composed: true
		}));
	}

	/**
	 * Emit completion event (interaction finished)
	 */
	protected emitComplete(): void {
		this.dispatchEvent(new CustomEvent('interaction:complete', {
			detail: {
				state: this.getCurrentState(),
				id: this.id
			},
			bubbles: true,
			composed: true
		}));
	}

	/**
	 * Emit hint shown event
	 */
	protected emitHintShown(message?: string): void {
		this.dispatchEvent(new CustomEvent('interaction:hint-shown', {
			detail: { message },
			bubbles: true,
			composed: true
		}));
	}

	/**
	 * Emit error event
	 */
	protected emitError(error: Error, message?: string): void {
		this.dispatchEvent(new CustomEvent('interaction:error', {
			detail: {
				error,
				message: message || error.message
			},
			bubbles: true,
			composed: true
		}));
	}

	// ==================== PUBLIC API (External Control) ====================

	/**
	 * Submit the interaction (triggers complete event)
	 * Can be called by shell or external code
	 */
	public submit(): void {
		if (!this.isInteractionComplete()) {
			const error = new Error('Cannot submit incomplete interaction');
			this.emitError(error, 'Please complete all required fields before submitting');
			throw error;
		}
		this.emitComplete();
	}

	/**
	 * Show hint to user
	 * Can be called by shell hint button or external code
	 */
	public hint(): void {
		this.onHint();
	}

	/**
	 * Reset the interaction to initial state
	 * Override in subclass to implement reset logic
	 */
	public reset(): void {
		this.progressTracker.reset();
		this.emitProgress();
		this.render();
	}

	/**
	 * Change the visual variant
	 * Updates attribute and calls hook
	 */
	public setVariant(variant: Variant): void {
		this.config.variant = variant;
		this.setAttribute('variant', variant);
		this.onVariantChange(variant);
	}

	/**
	 * Get current variant
	 */
	public getVariant(): Variant {
		return (this.getAttribute('variant') as Variant) || this.config.variant || 'outline';
	}
}
