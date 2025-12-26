/**
 * ProgressTracker - Utility for tracking interaction progress
 *
 * Shell-agnostic progress tracking that can be used by any interaction.
 * Maintains current/total state and calculates percentage.
 *
 * @example
 * ```typescript
 * const tracker = new ProgressTracker();
 * tracker.initialize(10);
 * tracker.increment();  // current = 1
 * tracker.getPercentage();  // 10
 * ```
 */
export class ProgressTracker {

	private _current = 0;
	private _total = 0;

	/**
	 * Initialize tracker with total number of items
	 */
	initialize(total: number): void {
		if (total < 0) {
			throw new Error('Total must be non-negative');
		}
		this._total = total;
		this._current = 0;
	}

	/**
	 * Set current progress value
	 */
	setCurrent(value: number): void {
		if (value < 0) {
			this._current = 0;
		} else if (value > this._total) {
			this._current = this._total;
		} else {
			this._current = value;
		}
	}

	/**
	 * Increment progress by 1
	 */
	increment(): void {
		if (this._current < this._total) {
			this._current++;
		}
	}

	/**
	 * Decrement progress by 1
	 */
	decrement(): void {
		if (this._current > 0) {
			this._current--;
		}
	}

	/**
	 * Reset progress to 0
	 */
	reset(): void {
		this._current = 0;
	}

	/**
	 * Get progress percentage (0-100)
	 */
	getPercentage(): number {
		if (this._total === 0) return 0;
		return Math.round((this._current / this._total) * 100);
	}

	/**
	 * Check if progress is complete
	 */
	isComplete(): boolean {
		return this._current === this._total && this._total > 0;
	}

	/**
	 * Get current value
	 */
	get current(): number {
		return this._current;
	}

	/**
	 * Get total value
	 */
	get total(): number {
		return this._total;
	}

	/**
	 * Get remaining items
	 */
	get remaining(): number {
		return Math.max(0, this._total - this._current);
	}
}
