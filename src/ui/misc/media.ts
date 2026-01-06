import { soundManager } from "../../shared/managers/SoundManager";
import { NormalizedAssets, Asset } from "../../shared/assets";
import { EduDialog } from "./dialog";

/**
 * setUpQuestionData - Configure content rendering with asset support
 *
 * Handles asset references (@:assetId) and renders content accordingly:
 * - If dialog=true: Render button that opens content in dialog
 * - If dialog=false/undefined: Render content inline with expand button
 *
 * @param questionString - Question text or asset reference (@:assetId)
 * @param container - Container element to render into
 * @param assets - Assets registry from interaction
 */
export function setUpQuestionData(
	questionString: string,
	container: HTMLElement,
	assets?: NormalizedAssets["assetsById"]
): void {
	// Clear container
	container.innerHTML = '';

	// Check for asset reference
	if (!questionString.startsWith("@:") || !assets || questionString.length < 3) {
		// Plain text fallback
		container.textContent = questionString;
		return;
	}

	// Extract asset reference
	const ref = questionString.slice(2);
	const asset = assets[ref];

	if (!asset) {
		// Asset not found, render ref as text
		container.textContent = ref;
		return;
	}

	console.log('DIALOG', asset.dialog);

	// Render based on dialog flag
	if (asset.dialog === true) {
		// Dialog-only mode: render trigger button
		renderDialogTrigger(container, asset);
	} else {
		// Inline mode: render content with expand button
		renderInlineWithExpand(container, asset);
	}
}

/**
 * Render a button that opens content in dialog (dialog=true mode)
 */
function renderDialogTrigger(container: HTMLElement, asset: Asset): void {
	const button = document.createElement('button');
	button.className = 'media-dialog-trigger';

	// Icon and label based on type
	const labels = {
		image: '<img src="assets/icons/image.svg" alt="image" width="24" height="24">View Image</img>',
		video: '<img src="assets/icons/video.svg" alt="image" width="24" height="24">Play Video</img>',
		audio: '<img src="assets/icons/audio.svg" alt="image" width="24" height="24">Play Audio</img>',
		html: '<img src="assets/icons/data.svg" alt="image" width="24" height="24">View Content</img>',
		tts: '<img src="assets/icons/audio.svg" alt="image" width="24" height="24">Play Audio</img>'
	};

	button.innerHTML = labels[asset.type];
	button.style.cssText = `
		width: 80%;
		justify-content: center;
		padding: 1rem 1.5rem;
		background: rgb(var(--edu-first-accent));
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	`;

	button.addEventListener('mouseenter', () => {
		button.style.transform = 'translateY(-2px)';
		button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
	});

	button.addEventListener('mouseleave', () => {
		button.style.transform = 'translateY(0)';
		button.style.boxShadow = 'none';
	});

	button.addEventListener('click', () => {
		openAssetInDialog(asset);
	});

	container.appendChild(button);
}

/**
 * Render content inline with expand button (dialog=false/undefined mode)
 */
function renderInlineWithExpand(container: HTMLElement, asset: Asset): void {
	// Create wrapper
	const wrapper = document.createElement('div');
	wrapper.style.cssText = `
position: relative; 
display: flex; 
justify-content: center; 
width: 100%; 
max-height: 20vh; 
overflow-y: auto; 
overflow-x: hidden;`;

	// Create edu-media element
	const media = document.createElement('edu-media');
	media.setAttribute('type', asset.type);

	// Set data based on asset type
	if (asset.type === 'image' || asset.type === 'video' || asset.type === 'audio') {
		media.setAttribute('data', asset.url);
	} else if (asset.type === 'html' || asset.type === 'tts') {
		media.setAttribute('data', asset.content);
	}

	// Set spec if available
	const spec: any = {};
	if (asset.type === 'image' && asset.size) {
		spec.size = asset.size;
	} else if (asset.type === 'video' && asset.span) {
		spec.span = asset.span;
	} else if ((asset.type === 'audio' || asset.type === 'tts') && asset.volume !== undefined) {
		spec.volume = asset.volume;
	}

	if (Object.keys(spec).length > 0) {
		media.setAttribute('spec', JSON.stringify(spec));
	}

	// Create expand button
	const expandBtn = document.createElement('button');
	expandBtn.className = 'media-expand-button';
	expandBtn.title = 'Expand to full view';
	expandBtn.innerHTML = `
		<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
				d="M3 7V3h4M17 7V3h-4M3 13v4h4M17 13v4h-4"/>
		</svg>
	`;
	expandBtn.style.cssText = `
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		border: none;
		border-radius: 6px;
		padding: 0.5rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		z-index: 10;
		opacity: 0.8;
	`;

	expandBtn.addEventListener('mouseenter', () => {
		expandBtn.style.opacity = '1';
		expandBtn.style.transform = 'scale(1.1)';
	});

	expandBtn.addEventListener('mouseleave', () => {
		expandBtn.style.opacity = '0.8';
		expandBtn.style.transform = 'scale(1)';
	});

	expandBtn.addEventListener('click', () => {
		openAssetInDialog(asset);
	});

	wrapper.appendChild(media);
	wrapper.appendChild(expandBtn);
	container.appendChild(wrapper);
}

/**
 * Open asset content in EduDialog
 */
function openAssetInDialog(asset: Asset): void {
	// Create dialog if needed
	let dialog = document.querySelector('edu-dialog#asset-dialog') as EduDialog;

	if (!dialog) {
		dialog = document.createElement('edu-dialog') as EduDialog;
		dialog.id = 'asset-dialog';
		document.body.appendChild(dialog);
	}

	const titles = {
		image: 'Image',
		video: 'Video',
		audio: 'Audio',
		html: 'Content',
		tts: 'Audio'
	};
	dialog.title = titles[asset.type];

	// Create edu-media for dialog content
	const media = document.createElement('edu-media');
	media.setAttribute('type', asset.type);

	if (asset.type === 'image' || asset.type === 'video' || asset.type === 'audio') {
		media.setAttribute('data', asset.url);
	} else if (asset.type === 'html' || asset.type === 'tts') {
		media.setAttribute('data', asset.content);
	}

	// Set spec
	const spec: any = {};
	if (asset.type === 'image' && asset.size) {
		spec.size = 'large'; // Force large in dialog
	} else if (asset.type === 'video' && asset.span) {
		spec.span = asset.span;
	} else if ((asset.type === 'audio' || asset.type === 'tts') && asset.volume !== undefined) {
		spec.volume = asset.volume;
	}

	if (Object.keys(spec).length > 0) {
		media.setAttribute('spec', JSON.stringify(spec));
	}

	// Clear and set content
	dialog.innerHTML = '';
	dialog.appendChild(media);
	dialog.open();
}

/**
 * EduMedia - Universal media renderer component
 *
 * Renders different media types based on the 'type' attribute.
 * Works with Asset interfaces from src/shared/assets.ts
 *
 * Attributes:
 * - type: "image" | "video" | "audio" | "html" | "tts"
 * - data: URL string for image/video/audio, or HTML content string
 * - spec: Optional specifications (JSON string)
 *   - For image: { size?: "small" | "medium" | "large" }
 *   - For video: { span?: { from: string, to: string } }
 *   - For audio: { volume?: number, loop?: boolean }
 *
 * Usage:
 * <edu-media type="image" data="https://example.com/photo.jpg" spec='{"size":"large"}'></edu-media>
 * <edu-media type="video" data="/assets/video.mp4"></edu-media>
 * <edu-media type="audio" data="/assets/sound.mp3" spec='{"volume":0.8,"loop":true}'></edu-media>
 * <edu-media type="html" data="<p>Rich <strong>HTML</strong> content</p>"></edu-media>
 */
export class EduMedia extends HTMLElement {
	private mediaType: string | null = null;
	private mediaData: string | null = null;
	private mediaSpec: Record<string, any> | null = null;

	// For audio playback control
	private audioPlaying: boolean = false;
	private currentAudioUrl: string | null = null;

	static get observedAttributes() {
		return ['type', 'data', 'spec'];
	}

	constructor() {
		super();
	}

	connectedCallback() {
		this.render();
	}

	attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
		if (oldValue === newValue) return;

		if (name === 'type') {
			this.mediaType = newValue;
		} else if (name === 'data') {
			this.mediaData = newValue;
		} else if (name === 'spec') {
			try {
				this.mediaSpec = newValue ? JSON.parse(newValue) : null;
			} catch (error) {
				console.warn('[EduMedia] Invalid spec JSON:', newValue);
				this.mediaSpec = null;
			}
		}

		if (this.isConnected) {
			this.render();
		}
	}

	disconnectedCallback() {
		// Stop audio if playing
		if (this.audioPlaying && this.currentAudioUrl) {
			soundManager.stop(this.currentAudioUrl);
			this.audioPlaying = false;
		}
	}

	private render(): void {
		if (!this.mediaType || !this.mediaData) {
			this.innerHTML = '';
			return;
		}

		switch (this.mediaType) {
			case 'image':
				this.renderImage();
				break;
			case 'video':
				this.renderVideo();
				break;
			case 'audio':
				this.renderAudio();
				break;
			case 'html':
				this.renderHtml();
				break;
			case 'tts':
				// TTS not implemented yet
				this.innerHTML = '<div style="font-style: italic; color: gray;">TTS not yet supported</div>';
				break;
			default:
				console.warn(`[EduMedia] Unknown media type: ${this.mediaType}`);
				this.innerHTML = '';
		}
	}

	private renderImage(): void {
		const size = this.mediaSpec?.size || 'medium';

		this.innerHTML = `
			<style>
				:host {
					display: block;
					width: 100%;
				}

				.media-image {
					width: 100%;
					display: block;
					object-fit: contain;
					border: 2px solid rgb(var(--edu-ink));
				}

				.media-image.small {
					max-width: 200px;
				}

				.media-image.medium {
					max-width: 400px;
				}

				.media-image.large {
					max-width: 100%;
				}
			</style>
			<img class="media-image ${size}" src="${this.mediaData}" alt="Media content" />
		`;
	}

	private renderVideo(): void {
		const span = this.mediaSpec?.span;
		const videoAttrs = span
			? `data-from="${span.from}" data-to="${span.to}"`
			: '';

		this.innerHTML = `
			<style>
				:host {
					display: block;
					width: 100%;
				}

				.media-video {
					width: 100%;
					height: auto;
					display: block;
					border: 2px solid rgb(var(--edu-ink));
				}
			</style>
			<video class="media-video" controls ${videoAttrs}>
				<source src="${this.mediaData}" />
				Your browser does not support the video tag.
			</video>
		`;

		// Handle span timing if provided
		if (span) {
			const video = this.querySelector('video');
			if (video) {
				const fromSeconds = this.parseTime(span.from);
				const toSeconds = this.parseTime(span.to);

				video.addEventListener('loadedmetadata', () => {
					if (fromSeconds !== null) {
						video.currentTime = fromSeconds;
					}
				});

				if (toSeconds !== null) {
					video.addEventListener('timeupdate', () => {
						if (video.currentTime >= toSeconds) {
							video.pause();
						}
					});
				}
			}
		}
	}

	private renderAudio(): void {
		const volume = this.mediaSpec?.volume !== undefined
			? this.mediaSpec.volume / 100 // Asset volume is 0-100, SoundManager uses 0-1
			: 1.0;
		const loop = this.mediaSpec?.loop ?? false;

		this.innerHTML = `
			<style>
				:host {
					display: block;
					width: 100%;
				}

				.media-audio {
					display: flex;
					align-items: center;
					gap: 1rem;
					padding: 1rem;
					background: rgba(var(--edu-first-accent), 0.1);
					border-radius: 8px;
				}

				.audio-button {
					display: flex;
					align-items: center;
					justify-content: center;
					width: 48px;
					height: 48px;
					background: rgb(var(--edu-first-accent));
					border: none;
					border-radius: 50%;
					cursor: pointer;
					transition: all 0.2s ease;
				}

				.audio-button:hover {
					transform: scale(1.05);
					box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
				}

				.audio-button:active {
					transform: scale(0.95);
				}

				.audio-button svg {
					width: 24px;
					height: 24px;
					fill: white;
				}

				.audio-label {
					flex: 1;
					font-size: 0.9rem;
					color: rgb(var(--edu-ink));
				}
			</style>
			<div class="media-audio">
				<button class="audio-button" title="Play audio">
					<img src="assets/icons/audio.svg" alt="Audio" width="24" height="24"/>
				</button>
				<div class="audio-label">Audio clip</div>
			</div>
		`;

		const button = this.querySelector('.audio-button') as HTMLButtonElement;

		if (button) {
			button.addEventListener('click', async () => {
				if (this.audioPlaying) {
					// Stop
					soundManager.stop(this.mediaData!);
					this.audioPlaying = false;
					this.currentAudioUrl = null;

					button.title = 'Play audio';
				} else {
					// Play
					this.currentAudioUrl = this.mediaData;

					console.log(this.currentAudioUrl);

					await soundManager.playSound(this.mediaData!, {
						volume,
						loop,
						onEnd: () => {
							this.audioPlaying = false;
							this.currentAudioUrl = null;
							button.title = 'Play audio';
						},
						onError: (error) => {
							console.error('[EduMedia] Audio playback error:', error);
							this.audioPlaying = false;
							this.currentAudioUrl = null;
							button.title = 'Play audio';
						}
					});

					this.audioPlaying = true;

					button.title = 'Stop audio';
				}
			});
		}
	}

	private renderHtml(): void {
		this.innerHTML = `
			<style>
				:host {
					display: block;
					width: 100%;
				}

				.media-html {
					width: 100%;
					color: rgb(var(--edu-ink));
				}

				.media-html * {
					max-width: 100%;
				}
			</style>
			<div class="media-html">${this.mediaData}</div>
		`;
	}

	/**
	 * Parse time string (mm:ss or hh:mm:ss) to seconds
	 */
	private parseTime(timeStr: string): number | null {
		const parts = timeStr.split(':').map(p => parseInt(p, 10));

		if (parts.length === 2) {
			// mm:ss
			return parts[0] * 60 + parts[1];
		} else if (parts.length === 3) {
			// hh:mm:ss
			return parts[0] * 3600 + parts[1] * 60 + parts[2];
		}

		return null;
	}
}

if (!customElements.get('edu-media')) {
	customElements.define('edu-media', EduMedia);
}
