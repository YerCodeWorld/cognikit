/**
 * SoundManager - Centralized audio playback utility
 *
 * Features:
 * - Play local sounds from /public/assets/audio/
 * - Play sounds from external URLs
 * - Preload and cache audio for better performance
 * - Volume control with fade effects
 * - Error handling and fallbacks
 */

export type SoundName = 'success' | 'failure' | 'pop' | 'low-time' | 'start' | 'flip';

export interface PlaySoundOptions {
	volume?: number;        // 0.0 to 1.0 (default: 1.0)
	loop?: boolean;         // Loop the sound (default: false)
	fadeIn?: number;        // Fade in duration in ms (default: 0)
	fadeOut?: number;       // Fade out duration in ms (default: 0)
	playbackRate?: number;  // Playback speed (default: 1.0)
	onEnd?: () => void;     // Callback when sound finishes
	onError?: (error: Error) => void; // Callback on error
}

export class SoundManager {
	public isEnabled = true;

	private audioCache: Map<string, HTMLAudioElement> = new Map();
	private activeSounds: Set<HTMLAudioElement> = new Set();
	private baseUrl = 'assets/audio/';

	private localSounds: Record<SoundName, string> = {
		'success': 'success.mp3',
		'failure': 'failure.mp3',
		'pop': 'pop.mp3',
		'low-time': 'low-time.mp3',
		'start': 'start.mp3',
		'flip': 'flip.mp3'
	};

	constructor() {
		if (typeof window !== 'undefined') {
			const base = document.querySelector('base')?.href || window.location.origin;
			this.baseUrl = new URL('assets/audio/', base).href;
		}
	}

	/**
	 * Play a sound by name or URL
	 * @param soundNameOrUrl - Predefined sound name or full URL
	 * @param options - Playback options
	 */
	public async playSound(
		soundNameOrUrl: SoundName | string,
		options: PlaySoundOptions = {}
	): Promise<void> {
		if (!this.isEnabled) {
			return;
		}

		try {
			const url = this.resolveUrl(soundNameOrUrl);
			const audio = await this.getAudio(url);

			this.configureAudio(audio, options);
			await this.playAudio(audio, options);
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			console.warn(`[SoundManager] Failed to play sound "${soundNameOrUrl}":`, err.message);

			if (options.onError) {
				options.onError(err);
			}
		}
	}

	/**
	 * Preload sounds for better performance
	 * @param sounds - Array of sound names or URLs to preload
	 */
	public async preload(sounds: (SoundName | string)[]): Promise<void> {
		const promises = sounds.map(async (sound) => {
			try {
				const url = this.resolveUrl(sound);
				await this.getAudio(url);
			} catch (error) {
				console.warn(`[SoundManager] Failed to preload sound "${sound}":`, error);
			}
		});

		await Promise.allSettled(promises);
	}

	/**
	 * Stop all currently playing sounds
	 */
	public stopAll(): void {
		this.activeSounds.forEach(audio => {
			audio.pause();
			audio.currentTime = 0;
		});
		this.activeSounds.clear();
	}

	/**
	 * Stop a specific sound
	 * @param soundNameOrUrl - Sound to stop
	 */
	public stop(soundNameOrUrl: SoundName | string): void {
		const url = this.resolveUrl(soundNameOrUrl);
		const audio = this.audioCache.get(url);

		if (audio) {
			audio.pause();
			audio.currentTime = 0;
			this.activeSounds.delete(audio);
		}
	}

	/**
	 * Clear the audio cache
	 */
	public clearCache(): void {
		this.stopAll();
		this.audioCache.clear();
	}

	/**
	 * Set global volume for all future sounds
	 * @param volume - Volume level (0.0 to 1.0)
	 */
	public setGlobalVolume(volume: number): void {
		const clampedVolume = Math.max(0, Math.min(1, volume));

		this.activeSounds.forEach(audio => {
			audio.volume = clampedVolume;
		});
	}

	// ==================== PRIVATE METHODS ====================

	/**
	 * Resolve sound name to full URL
	 */
	private resolveUrl(soundNameOrUrl: SoundName | string): string {
		// Check if it's a local sound name
		if (soundNameOrUrl in this.localSounds) {
			const filename = this.localSounds[soundNameOrUrl as SoundName];
			return `${this.baseUrl}${filename}`;
		}

		// Check if it's already a full URL
		if (soundNameOrUrl.startsWith('http://') || soundNameOrUrl.startsWith('https://')) {
			return soundNameOrUrl;
		}

		// Treat as relative path
		return `${this.baseUrl}${soundNameOrUrl}`;
	}

	/**
	 * Get or create audio element
	 */
	private async getAudio(url: string): Promise<HTMLAudioElement> {
		// Return cached audio if available
		if (this.audioCache.has(url)) {
			return this.audioCache.get(url)!.cloneNode(true) as HTMLAudioElement;
		}

		// Create new audio element
		const audio = new Audio();

		// Set up loading with timeout
		const loaded = new Promise<void>((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error('Audio loading timeout'));
			}, 10000); // 10 second timeout

			audio.addEventListener('canplaythrough', () => {
				clearTimeout(timeout);
				resolve();
			}, { once: true });

			audio.addEventListener('error', () => {
				clearTimeout(timeout);
				reject(new Error(`Failed to load audio: ${url}`));
			}, { once: true });
		});

		// Start loading
		audio.src = url;
		audio.preload = 'auto';
		audio.load();

		// Wait for audio to be ready
		await loaded;

		// Cache the original
		this.audioCache.set(url, audio);

		// Return a clone for actual playback
		return audio.cloneNode(true) as HTMLAudioElement;
	}

	/**
	 * Configure audio element with options
	 */
	private configureAudio(audio: HTMLAudioElement, options: PlaySoundOptions): void {
		audio.volume = options.volume !== undefined ? Math.max(0, Math.min(1, options.volume)) : 1.0;
		audio.loop = options.loop ?? false;
		audio.playbackRate = options.playbackRate ?? 1.0;

		// Apply fade in
		if (options.fadeIn && options.fadeIn > 0) {
			audio.volume = 0;
			this.fadeVolume(audio, options.volume ?? 1.0, options.fadeIn);
		}
	}

	/**
	 * Play audio with error handling
	 */
	private async playAudio(audio: HTMLAudioElement, options: PlaySoundOptions): Promise<void> {
		this.activeSounds.add(audio);

		const cleanup = () => {
			this.activeSounds.delete(audio);
			if (options.onEnd) {
				options.onEnd();
			}
		};

		audio.addEventListener('ended', cleanup, { once: true });

		if (options.fadeOut && options.fadeOut > 0 && !options.loop) {
			audio.addEventListener('timeupdate', () => {
				const remainingTime = audio.duration - audio.currentTime;
				if (remainingTime <= options.fadeOut! / 1000) {
					this.fadeVolume(audio, 0, options.fadeOut!);
				}
			});
		}

		try {
			await audio.play();
		} catch (error) {
			this.activeSounds.delete(audio);
			throw new Error(`Playback failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Fade volume over time
	 */
	private fadeVolume(audio: HTMLAudioElement, targetVolume: number, duration: number): void {
		const startVolume = audio.volume;
		const volumeDelta = targetVolume - startVolume;
		const startTime = Date.now();

		const fade = () => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);

			audio.volume = startVolume + (volumeDelta * progress);

			if (progress < 1 && this.activeSounds.has(audio)) {
				requestAnimationFrame(fade);
			}
		};

		requestAnimationFrame(fade);
	}
}

export const soundManager = new SoundManager();
