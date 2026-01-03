import { ProgressTracker } from "./utilities/ProgressTracker";
import { Variant } from "../shared";
import { InteractionConfig, InteractionMechanic } from "../types/Interactions";
import { InteractionData } from "../types/Data";
import { NormalizedAssets } from "../shared/assets";
import { AnimationsManager, SoundManager } from "../shared/managers";

export type InteractionEventMap = {
	'interaction:ready': CustomEvent<{ id: string }>;
	'interaction:progress': CustomEvent<{ current: number; total: number; percentage: number }>;
	'interaction:state-change': CustomEvent<{ state: any; isComplete: boolean }>;
	'interaction:complete': CustomEvent<{ state: any; id: string }>;
	'interaction:hint-shown': CustomEvent<{ message?: string }>;
	'interaction:error': CustomEvent<{ error: Error; message: string }>;
};

export abstract class BaseInteraction<T extends InteractionData> extends HTMLElement {
	
	// ==================== PROPERTIES ====================

	public readonly id: string;
	abstract readonly interactionMechanic: InteractionMechanic;

	protected data: T;
	protected config: InteractionConfig;
	protected assets: NormalizedAssets | null;

	protected progressTracker: ProgressTracker;
	protected animationsManager: AnimationsManager;
	protected soundManager: SoundManager;

	private _initialized = false;

	// ==================== CONSTRUCTOR ====================

	constructor(data: T, config: InteractionConfig, assets?: NormalizedAssets | null) {
		super();

		this.id = crypto.randomUUID();
		this.data = data;
		this.config = config;
		this.assets = assets;

		this.progressTracker = new ProgressTracker();
		
		this.soundManager = new SoundManager();
		this.soundManager.isEnabled = this.config.soundEnabled;

		this.animationsManager = new AnimationsManager();
		this.animationsManager.isEnabled = this.config.animationsEnabled;

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

	// ==================== ABSTRACT METHODS ====================
	abstract render(): void;
	abstract getCurrentState(): any;
	abstract isInteractionComplete(): boolean;
	abstract onHint(): void;

	// ==================== OPTIONAL LIFECYCLE HOOKS ====================

	protected initialize(): void {}
	protected cleanup(): void {}

	// ==================== PROGRESS TRACKING ====================

	protected initializeProgress(total: number): void {
		this.progressTracker.initialize(total);
		this.emitProgress();
	}

	protected setProgress(current: number): void {
		this.progressTracker.setCurrent(current);
		this.emitProgress();
	}

	protected incrementProgress(): void {
		this.progressTracker.increment();
		this.emitProgress();
	}

	protected decrementProgress(): void {
		this.progressTracker.decrement();
		this.emitProgress();
	}

	protected getProgress(): { current: number; total: number; percentage: number } {
		return {
			current: this.progressTracker.current,
			total: this.progressTracker.total,
			percentage: this.progressTracker.getPercentage()
		};
	}

	// ==================== EVENT EMISSION  ====================

	private emitReady(): void {
		this.dispatchEvent(new CustomEvent('interaction:ready', {
			detail: { id: this.id },
			bubbles: true,
			composed: true
		}));
	}

	protected emitProgress(): void {
		const progress = this.getProgress();
		this.dispatchEvent(new CustomEvent('interaction:progress', {
			detail: progress,
			bubbles: true,
			composed: true
		}));
	}

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

	protected emitHintShown(message?: string): void {
		this.dispatchEvent(new CustomEvent('interaction:hint-shown', {
			detail: { message },
			bubbles: true,
			composed: true
		}));
	}

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

	// ==================== PUBLIC API ====================
	
	public onVariantChange(newVariant: Variant): void {}
	public setSteps(steps: number): void {}

	public submit(): void {
		if (!this.isInteractionComplete()) {
			const error = new Error('Cannot submit incomplete interaction');
			this.emitError(error, 'Please complete all required fields before submitting');
			throw error;
		}
		this.emitComplete();
	}
	
	public hint(): void {
		this.onHint();
	}

	public reset(): void {
		this.progressTracker.reset();
		this.emitProgress();
		this.render();
	}

	public setVariant(variant: Variant): void {
		this.config.variant = variant;
		this.setAttribute('variant', variant);
		this.onVariantChange(variant);
	}

	public getVariant(): Variant {
		return (this.getAttribute('variant') as Variant) || this.config.variant || 'outline';
	}
}
