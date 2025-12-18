// applicationWindow.ts

import { ComponentThemeVariant } from "./../types"; 

// TODO: Extend to default support toggable radio navigation API, feedback popover, metadata popover and question counter
const HTML = `
	<header part='header'>
		<div class='title' part='title'/>
	</header>
		
	<div class='content' part='content'>
		<slot></slot>
	</div>

	<footer id='footer' part='footer'>
		<button class="check-btn" type="button" part="check">
	</footer>
`;

const CSS = `
	:host {
		--edu-bg:            247 249 252;
		--edu-card:          255 255 255;

		--edu-ink:           31 41 55;
		--edu-second-ink:    71 85 105;
		--edu-third-ink:     100 116 139;

		--edu-inverted-ink:  248 250 252;

		--edu-success:       22 163 74;
		--edu-error:         220 38 38;
		--edu-warning:       255 222 33;
		--edu-neutral:       14 165 233;

		--edu-first-accent:  99 102 241;
		--edu-second-accent: 245 158 11;
		--edu-third-accent:  236 72 153;

		--edu-border:        229 231 235;
		--edu-muted:         243 244 246;

		--edu-radius:        0.375rem;
		--edu-shadow-color:  0 0 0;

		--edu-pad:	1rem;
		--edu-mar:	0;
	}

	.wrap {
		display: block;
		color: rgb(var(--edu-ink));
		background: rgb(var(--edu-bg));
		margin: var(--edu-mar);
	}
	
	header {
		margin-bottom: 1rem;
		padding: 0.75rem;
		border-bottom: 1px solid rgb(var(--edu-border));
	}

	.title {
		padding: 0.75rem;
		font-size: 1.25rem;
		font-weight: 700;
	}

	.content {
		min-height: 100px;
	}

	footer {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 1rem;
		gap: 0.5rem;
	}

	.check-btn {
		padding: 0.75rem 2rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		border: none;
		border-radius: var(--edu-radius);
		background: rgb(var(--edu-first-accent));
		color: rgb(var(--edu-inverted-ink));
		transition: all 0.2s ease;
	}

	.check-btn:hover:not(:disabled) {
		background: rgb(var(--edu-first-accent) / 0.9);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgb(var(--edu-first-accent) / 0.3);
	}

	.check-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}
`;

const variants: Record<ComponentThemeVariant, string> = {

	empty: `
		background: transparent;
		border: none;
		
		header {
			padding: 0;
			margin: 20px;
			border-bottom: none;
		}
		
		.title { padding-bottom: 5px; border-bottom: 5px solid rgb(var(--edu-ink)); width: fit-content }
		
		.check-btn {
			background: transparent;
			color: rgb(var(--edu-ink));
			border: 2px solid rgb(var(--edu-ink));
			border-radius: 0;
		}
		
		.check-btn:hover { color: rgb(var(--edu-inverted-ink)); border: 0 }
	`,

	minimal: `
		border: 1px solid rgb(var(--edu-border));
		border-radius: 6px;

		.check-btn {
			border-radius: 4px;
		}

		footer {
			border-top: 1px solid rgb(var(--edu-border));
		}
	`,

	elegant: `
		border-radius: 10px;
		box-shadow: 0 10px 30px rgba(var(--edu-shadow-color), 0.15);

		.check-btn {
			border-radius: 8px;
			font-size: 1rem;
		}

		footer {
			border-top: 1px solid rgb(var(--edu-border) / 0.5);
			padding: 1.25rem;
		}
	`,

	playful: `
		color: rgb(var(--edu-first-accent));
		border-radius: 14px;
		border: 2px dashed rgb(var(--edu-border));

		.check-btn {
			border-radius: 12px;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}

		.check-btn:hover:not(:disabled) {
			transform: translateY(-2px) rotate(-1deg);
		}

		footer {
			border-top: 2px dashed rgb(var(--edu-border));
		}
	`,

	glass: `
		background: rgba(var(--edu-card), 0.7);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(var(--edu-border), 0.35);
		border-radius: 12px;

		.check-btn {
			background: rgba(var(--edu-first-accent), 0.9);
			backdrop-filter: blur(5px);
			border-radius: 10px;
		}

		.check-btn:hover:not(:disabled) {
			background: rgba(var(--edu-first-accent), 1);
		}

		footer {
			border-top: 1px solid rgba(var(--edu-border), 0.35);
		}
	`,

	letter: `
		border: 1px solid rgb(var(--edu-border));
		font-family: georgia, serif;
		box-shadow: inset 0 0 0 1px rgba(var(--edu-shadow-color), 0.1);
		border-radius: 4px;

		.check-btn {
			font-family: georgia, serif;
			border-radius: 2px;
			font-size: 0.95rem;
			letter-spacing: 0.5px;
		}

		footer {
			border-top: 1px solid rgb(var(--edu-border));
			padding: 1rem 1.5rem;
		}
	`,

	sign: `
		border-radius: 6px;
		text-transform: uppercase;
		letter-spacing: 1px;
		border: 2px solid rgb(var(--edu-border));

		.check-btn {
			text-transform: uppercase;
			letter-spacing: 1.5px;
			font-weight: 800;
			font-size: 0.9rem;
			border-radius: 4px;
			padding: 0.85rem 2.5rem;
		}

		footer {
			border-top: 2px solid rgb(var(--edu-border));
		}

		.title {
			text-transform: uppercase;
		}
	`,

	outline: `
		color: rgb(var(--edu-inverted-ink));
		background: transparent;
		border: 2px solid rgb(var(--edu-first-accent));
		border-bottom: 4px solid rgb(var(--edu-first-accent));

		header {
			background: rgb(var(--edu-first-accent));
			border-bottom: none;
			margin-bottom: 0;
			padding-bottom: 0.75rem;
		}

		.title {
			color: rgb(var(--edu-inverted-ink));
		}

		footer {
			padding: 0;
			border-top: none;
		}

		.check-btn {
			font-size: 1.25rem;
			font-weight: 700;
			border: none;
			border-radius: 0;
			border-top-left-radius: 10px;
			border-top-right-radius: 10px;
			color: rgb(var(--edu-inverted-ink));
			background: rgb(var(--edu-first-accent));
			margin: 0;
			padding: 1rem;
			text-transform: uppercase;
		}

		.check-btn:hover:not(:disabled) {
			background: rgb(var(--edu-first-accent) / 0.9);
			box-shadow: 0 4px 12px rgb(var(--edu-first-accent) / 0.3);
			transform: none;
		}
	`,

	card: `
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(var(--edu-shadow-color), 0.1), 0 2px 4px rgba(var(--edu-shadow-color), 0.05);

		.check-btn {
			border-radius: 6px;
			box-shadow: 0 2px 4px rgba(var(--edu-shadow-color), 0.1);
		}

		.check-btn:hover:not(:disabled) {
			box-shadow: 0 4px 8px rgba(var(--edu-first-accent), 0.2);
		}

		footer {
			border-top: 1px solid rgb(var(--edu-border));
		}
	`

}

export class EduApplicationWindow extends HTMLElement {

	static get observedAttributes() {
		return ['variant', 'heading', 'footer', 'show-header', 'show-footer'];
	}

	private $titleEl!: HTMLElement;
	private $headerEl!: HTMLElement;
	private $footerEl!: HTMLElement;
	private $wrapEl!: HTMLElement;
	private $styleEl!: HTMLStyleElement;

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
		this.$footerEl = wrap.querySelector('#footer');
	}

	// Public getter to access the footer element from outside
	public getFooter(): HTMLElement {
		return this.$footerEl;
	}
	
	public getCheckBtn(): HTMLButtonElement {
		return this.$footerEl.querySelector<HTMLButtonElement>('.check-btn');
	}
	
	connectedCallback() {
		if (!this.hasAttribute("variant")) this.setAttribute("variant", "elegant");
		if (!this.hasAttribute("show-header")) this.setAttribute("show-header", "true");
		if (!this.hasAttribute("show-footer")) this.setAttribute("show-footer", "true");
		this.updateVariant();
		this.sync();
	}

	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if (name === 'variant' && oldValue !== newValue) {
			this.updateVariant();
		}
		if (name === 'show-header' || name === 'show-footer') {
			this.updateVisibility();
		}
		this.sync();
	}
	
	private updateVariant() {
		const variant = this.getAttribute('variant') ?? 'outline';
		// if (typeOf variant === 'ComponentThemeVariant') ...
		const keys = Object.keys(variants);
		const variantStyle = variants[keys.includes(variant) ? variant : 'outline'];

		this.$styleEl.textContent = `
			${CSS}
			.wrap {
				${variantStyle}
			}
		`;
	}

	private updateVisibility() {
		const showHeader = this.getAttribute('show-header') !== 'false';
		const showFooter = this.getAttribute('show-footer') !== 'false';

		this.$headerEl.style.display = showHeader ? '' : 'none';
		this.$footerEl.style.display = showFooter ? '' : 'none';
	}

	private sync() {
		const heading = this.getAttribute('heading') ?? '';
		this.$titleEl.textContent = heading;
		this.updateVisibility();
	}
}

if (!customElements.get('edu-window')) customElements.define('edu-window', EduApplicationWindow);

