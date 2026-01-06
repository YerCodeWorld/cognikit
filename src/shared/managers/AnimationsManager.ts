/**
 * AnimationsManager - Utility for managing animations in Shadow DOM components
 *
 * Shadow DOM components cannot access keyframes defined in the main document.
 * This manager injects keyframe definitions into Shadow DOM and provides
 * a simple API to apply animations to elements.
 */

export type AnimationName =
	| 'shake'
	| 'pulse-green'
	| 'bounce-in'
	| 'float'
	| 'rubber'
	| 'jello'
	| 'heartbeat'
	| 'shimmer'
	| 'wobble'
	| 'pop'
	| 'fade-slide'
	| 'swing'
	| 'orbit'
	| 'flash'
	| 'spin-pulse';

export interface AnimationOptions {
	duration?: string;
	timing?: string;
	iterations?: string | number;
	delay?: string;
}

/**
 * All keyframe definitions
 */
const KEYFRAMES = `
@keyframes shake {
	0%, 100% { transform: translateX(0); }
	25% { transform: translateX(-8px); }
	75% { transform: translateX(8px); }
}

@keyframes pulse-green {
	0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
	70% { box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); }
	100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

@keyframes bounce-in {
	0% { opacity: 0; transform: scale(0.3); }
	100% { opacity: 1; transform: scale(1); }
}

@keyframes float {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-10px); }
}

@keyframes rubber {
	0% { transform: scale3d(1, 1, 1); }
	30% { transform: scale3d(1.25, 0.75, 1); }
	40% { transform: scale3d(0.75, 1.25, 1); }
	50% { transform: scale3d(1.15, 0.85, 1); }
	100% { transform: scale3d(1, 1, 1); }
}

@keyframes jello {
	11.1% { transform: none; }
	22.2% { transform: skewX(-12.5deg) skewY(-12.5deg); }
	44.4% { transform: skewX(6.25deg) skewY(6.25deg); }
	66.6% { transform: skewX(-1.56deg) skewY(-1.56deg); }
	100% { transform: none; }
}

@keyframes heartbeat {
	0% { transform: translateY(-50%) scale(1); }
	14% { transform: translateY(-50%) scale(1.1); }
	28% { transform: translateY(-50%)  scale(1); }
	42% { transform: translateY(-50%) scale(1.1); }
	70% { transform: translateY(-50%) scale(1); }
}

@keyframes shimmer {
	0% { background-position: 200% 0; }
	100% { background-position: -200% 0; }
}

@keyframes wobble {
	0%, 100% { transform: translateX(0); }
	25% { transform: rotate(-5deg); }
	75% { transform: rotate(5deg); }
}

@keyframes pop {
	0% { transform: scale(0); }
	100% { transform: scale(1); }
}

@keyframes fade-slide {
	from { opacity:0; transform: translateY(10px); }
	to { opacity:1; transform: translateY(0); }
}

@keyframes swing {
	20% { transform: rotate(15deg); }
	40% { transform: rotate(-10deg); }
	60% { transform: rotate(5deg); }
	80% { transform: rotate(-5deg); }
	100% { transform: rotate(0deg); }
}

@keyframes spin-pulse {
    0% { transform: translateY(-50%) scale(1) rotate(0deg); }
    50% { transform: translateY(-50%) scale(1.8) rotate(180deg); color: #fbbc05; }
    100% { transform: translateY(-50%) scale(1) rotate(360deg); }
}

@keyframes flash {
	0%, 50%, 100% { opacity: 1; }
	25%, 75% { opacity: 0; }
}

@keyframes orbit {
	0% { transform: rotate(0deg) translateX(0) rotate(0deg); }
	50% { transform: rotate(180deg) translateX(50px) rotate(-180deg) scale(1.5); }
	100% { transform: rotate(360deg) translateX(0) rotate(-360deg); }
}
`;

/**
 * Default animation configurations
 */
const DEFAULT_CONFIG: Record<AnimationName, string> = {
	'shake': '0.4s',
	'pulse-green': '2s infinite',
	'bounce-in': '0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
	'float': '3s ease-in-out infinite',
	'rubber': '0.6s',
	'jello': '0.8s',
	'heartbeat': '1.5s ease-in-out infinite',
	'shimmer': '2s infinite',
	'wobble': '0.5s',
	'pop': '0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
	'fade-slide': '0.5s ease-out',
	'swing': '2s infinite',
	'flash': '0.5s',
	'orbit': '1s ease-in-out',
	'spin-pulse': '3s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite'
};

export class AnimationsManager {

	private static injectedRoots = new WeakSet<ShadowRoot>();

	public isEnabled = false;

	/**
	 * Inject keyframes into a Shadow DOM
	 * Call this once during component initialization
	 */
	static injectKeyframes(shadowRoot: ShadowRoot): void {
		if (this.injectedRoots.has(shadowRoot)) {
			return; 
		}

		const styleEl = document.createElement('style');
		styleEl.textContent = KEYFRAMES;
		shadowRoot.prepend(styleEl);

		this.injectedRoots.add(shadowRoot);
	}

	/**
	 * Apply animation to an element
	 * @param element - The element to animate (can be in Shadow DOM)
	 * @param animationName - Name of the animation
	 * @param options - Optional animation configuration
	 */
	animate(
		element: HTMLElement,
		animationName: AnimationName,
		options?: AnimationOptions
	): void {

		
		if (!this.isEnabled) return;

		element.style.animation = '';

		const duration = options?.duration || '';
		const timing = options?.timing || '';
		const iterations = options?.iterations || '';
		const delay = options?.delay || '';

		// Build animation string
		let animation = '';

		if (duration || timing || iterations || delay) {
			animation = `${animationName} ${duration} ${timing} ${delay} ${iterations}`.trim();
		} else {
			// Use default config
			animation = `${animationName} ${DEFAULT_CONFIG[animationName]}`;
		}

		element.style.animation = animation;
	}

	/**
	 * Stop/clear animation on an element
	 */
	stop(element: HTMLElement): void {
		element.style.animation = '';
	}

	/**
	 * Animate element for a specific duration then auto-stop
	 * @param element - The element to animate
	 * @param animationName - Name of the animation
	 * @param durationMs - Duration in milliseconds before auto-stopping
	 * @param options - Optional animation configuration
	 */
	animateFor(
		element: HTMLElement,
		animationName: AnimationName,
		durationMs: number,
		options?: AnimationOptions
	): void {
		if (!this.isEnabled) return;

		// Start animation
		this.animate(element, animationName, options);

		// Stop after specified time
		setTimeout(() => {
			this.stop(element);
		}, durationMs);
	}

	/**
	 * Get all available animation names
	 */
	getAvailableAnimations(): AnimationName[] {
		return Object.keys(DEFAULT_CONFIG) as AnimationName[];
	}

	/**
	 * Apply animation using CSS class (for hover/active states)
	 * Requires keyframes to be available in the component's Shadow DOM
	 */
	addAnimationClass(element: HTMLElement, animationName: AnimationName): void {
		if (!this.isEnabled) return;
		element.classList.add(`anim-${animationName}`);
	}

	/**
	 * Remove animation class
	 */
	removeAnimationClass(element: HTMLElement, animationName: AnimationName): void {
		element.classList.remove(`anim-${animationName}`);
	}
}
