import { Variant } from "../../../shared";
import { AnimationsManager } from "../../../shared/managers";

const HTML = `
<style>
	:host {
		display: block;
		cursor: pointer;
		width: 100%;
		height: 100%;
		box-sizing: border-box;

		/* Enable container queries */
		container-type: size;
		container-name: edu-block;

		--accent-color: rgb(var(--edu-first-accent));
		--block-min-height: 44px; /* Interaction Floor */
		-webkit-text-size-adjust: 100%;
		text-size-adjust: 100%;
	}

	.block {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: rgb(var(--edu-ink));
		gap: clamp(0.25rem, 1cqh, 0.5rem);

		/* Fluid padding */
		padding: clamp(0.5rem, min(2cqw, 2cqh), 1.5rem);

		background: rgb(var(--edu-bg));
		border: 2px solid rgb(var(--edu-border));
		border-radius: var(--edu-radius);

		height: 100%;
		width: 100%;
		box-sizing: border-box;

		/* Fluid typography */
		font-size: clamp(0.9rem, 16cqh, 2rem);
		line-height: 1.2;

		transition: all 0.2s ease;
		text-align: center;
		min-height: var(--block-min-height);
	}

	.block:hover {
		transform: translateY(-2px);
		box-shadow: 0 clamp(2px, 1cqh, 4px) clamp(6px, 2cqh, 12px) rgba(var(--edu-shadow-color), 0.15);
	}

	/* ==================== VARIANT: ELEGANT ==================== */

	.block[variant="elegant"] {
		background: rgb(var(--edu-card));
		border-radius: clamp(6px, 1.5cqw, 8px);
		color: rgb(var(--edu-ink));
		box-shadow: 0 clamp(2px, 1cqh, 4px) clamp(6px, 2cqh, 12px) rgba(var(--edu-shadow-color), 0.1);
		border-left: clamp(3px, 1cqw, 4px) solid var(--accent-color);
	}

	.block[variant="elegant"]:hover {
		box-shadow: 0 clamp(3px, 1.5cqh, 6px) clamp(8px, 2.5cqh, 16px) rgba(var(--edu-shadow-color), 0.15);
		transform: translateY(-3px);
	}

	/* ==================== VARIANT: PLAYFUL ==================== */

	.block[variant="playful"] {
		background: var(--accent-color);
		border: none;
		color: rgb(var(--edu-inverted-ink));
		border-radius: clamp(12px, 3cqw, 16px);
		box-shadow: clamp(1px, 0.5cqw, 2px) clamp(1px, 0.5cqh, 2px) 0px rgba(var(--edu-shadow-color) / 0.2);
		font-weight: 600;
	}

	.block[variant="playful"]:hover {
		transform: translateY(-2px) rotate(-2deg);
		box-shadow: 0 clamp(3px, 1.5cqh, 6px) clamp(8px, 2.5cqh, 16px) rgba(var(--edu-first-accent), 0.4);
	}

	/* ==================== VARIANT: OUTLINE ==================== */

	.block[variant="outline"] {
		background: transparent;
		border: 2px solid var(--accent-color);
		border-top: clamp(4px, 1.5cqh, 6px) solid var(--accent-color);
		border-radius: 0;
	}

	.block[variant="outline"]:hover {
		background: rgb(var(--edu-first-accent) / 0.1);
		border-width: 3px;
		border-top-width: clamp(5px, 2cqh, 7px);
	}

	/* ==================== VARIANT: LETTER ==================== */

	.block[variant="letter"] {
		font-family: georgia, serif;
		color: rgb(var(--edu-ink));
		background: rgb(var(--edu-card));
		border: 1px solid rgb(var(--edu-border));
		border-radius: clamp(3px, 0.8cqw, 4px);
		box-shadow: inset 0 0 0 1px rgba(var(--edu-shadow-color), 0.05);
	}

	.block[variant="letter"]:hover {
		box-shadow:
			inset 0 0 0 1px rgba(var(--edu-shadow-color), 0.05),
			0 clamp(1px, 0.5cqh, 2px) clamp(3px, 1.5cqh, 6px) rgba(var(--edu-shadow-color), 0.1);
	}

	/* ==================== VARIANT: MINIMAL ==================== */

	.block[variant="minimal"] {
		background: rgb(var(--edu-card));
		color: rgb(var(--edu-ink));
		border: 1px solid rgb(var(--edu-border));
		border-radius: clamp(4px, 1cqw, 6px);
		padding: clamp(0.4rem, min(1.5cqw, 1.5cqh), 0.75rem);
	}

	.block[variant="minimal"]:hover {
		border-color: rgb(var(--edu-first-accent) / 0.5);
		box-shadow: 0 1px clamp(2px, 1cqh, 4px) rgba(var(--edu-shadow-color), 0.1);
	}

	/* ==================== VARIANT: GLASS ==================== */

	.block[variant="glass"] {
		background: rgba(var(--edu-card), 0.7);
		backdrop-filter: blur(10px);
		border: 2px solid rgba(var(--edu-border), 0.35);
		border-radius: clamp(8px, 2cqw, 12px);
	}

	.block[variant="glass"]:hover {
		background: rgba(var(--edu-card), 0.85);
		border-color: rgba(var(--edu-first-accent), 0.5);
	}

	/* ==================== VARIANT: CARD ==================== */

	.block[variant="card"] {
		background: rgb(var(--edu-card));
		border: 2px solid rgb(var(--edu-border));
		border-radius: clamp(6px, 1.5cqw, 8px);
		box-shadow: 0 clamp(1px, 0.5cqh, 2px) clamp(4px, 2cqh, 8px) rgba(var(--edu-shadow-color), 0.08);
	}

	.block[variant="card"]:hover {
		border-color: rgb(var(--edu-first-accent));
		box-shadow: 0 clamp(2px, 1cqh, 4px) clamp(6px, 2.5cqh, 12px) rgba(var(--edu-shadow-color), 0.12);
	}

	/* ==================== VARIANT: SIGN ==================== */

	.block[variant="sign"] {
		background: rgb(var(--edu-card));
		border: clamp(3px, 1cqw, 4px) double rgb(var(--edu-border));
		color: rgb(var(--edu-ink));
		border-radius: 0;
		text-align: center;
		text-transform: uppercase;
		letter-spacing: clamp(1px, 0.5cqw, 2px);
		font-weight: 700;
	}

	.block[variant="sign"]:hover {
		border-color: var(--accent-color);
		background: rgba(var(--accent-color), 0.1);
	}

	/* ==================== VARIANT: EMPTY ==================== */

	.block[variant="empty"] {
		background: transparent;
		color: rgb(var(--edu-ink));
		border: clamp(2px, 0.8cqw, 3px) solid rgb(var(--edu-ink));
		border-radius: 0;
		padding: clamp(0.4rem, min(1.5cqw, 1.5cqh), 0.75rem);
	}

	.block[variant="empty"]:hover {
		background: var(--accent-color);
		color: rgb(var(--edu-inverted-ink));
		border-color: rgb(var(--edu-ink));
	}

	/* ==================== RESPONSIVE ADJUSTMENTS ==================== */

	/* Tight heights: reduce padding and font size */
	@container edu-block (max-height: 60px) {
		.block {
			font-size: clamp(0.7rem, 12cqh, 0.95rem);
			padding: clamp(0.25rem, min(1cqw, 1cqh), 0.5rem);
			gap: clamp(0.15rem, 0.8cqh, 0.3rem);
		}
	}

	/* Very tight heights: minimal padding */
	@container edu-block (max-height: 50px) {
		.block {
			font-size: clamp(0.65rem, 11cqh, 0.9rem);
			padding: clamp(0.2rem, min(0.8cqw, 0.8cqh), 0.4rem);
			gap: clamp(0.1rem, 0.5cqh, 0.2rem);
		}
	}

	/* Tall blocks: scale up font */
	@container edu-block (min-height: 120px) {
		.block {
			font-size: clamp(1rem, 18cqh, 2.4rem);
			padding: clamp(0.75rem, min(2.5cqw, 2.5cqh), 2rem);
			gap: clamp(0.4rem, 1.5cqh, 0.75rem);
		}
	}
</style>
<div class="block" part="block">
	<slot></slot>
</div>
`;

export class EduBlockScalable extends HTMLElement {

	static get observedAttributes() { return ["variant"]; }

	private $blockEl!: HTMLDivElement;

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot!.innerHTML = HTML;
		this.$blockEl = this.shadowRoot!.querySelector('.block') as HTMLDivElement;

		AnimationsManager.injectKeyframes(this.shadowRoot!);
	}

	connectedCallback() {
		if (!this.hasAttribute("variant")) this.variant = "outline";
		this.sync();
	}

	attributeChangedCallback() {
		this.sync();
	}

	private sync() {
		if (this.$blockEl) {
			this.$blockEl.setAttribute('variant', this.variant);
		}
	}

	public getBlock() { return this.$blockEl };

	get variant(): Variant {
		return (this.getAttribute("variant") ?? "outline") as Variant;
	}

	set variant(v: Variant) { this.setAttribute("variant", v); }

	public setAccentColor(newAccent: string): void {
		const el = this.shadowRoot!.host as EduBlockScalable;
		el.style.setProperty('--accent-color', newAccent);
	}

	public removeSelf() { this.remove(); }
}

if (!customElements.get("edu-block-scalable")) {
	customElements.define("edu-block-scalable", EduBlockScalable);
}
