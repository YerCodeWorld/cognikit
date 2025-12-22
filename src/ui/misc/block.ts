import { Variant } from "../../shared";

const HTML = `
<style>
	:host {
		display: block;
		cursor: pointer;
	}

	.block {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		background: rgb(var(--edu-bg));
		border: 2px solid rgb(var(--edu-border));
		border-radius: var(--edu-radius);
		transition: all 0.2s ease;
		user-select: none;
	}

	.block:hover {
		border-color: rgb(var(--edu-first-accent));
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(var(--edu-shadow-color), 0.15);
	}

	/* ELEGANT VARIANT */
	.block[variant="elegant"] {
		background: rgb(var(--edu-card));
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(var(--edu-shadow-color), 0.1);
		border-left: 4px solid rgb(var(--edu-first-accent));
	}

	.block[variant="elegant"]:hover {
		box-shadow: 0 6px 16px rgba(var(--edu-shadow-color), 0.15);
		transform: translateY(-3px);
	}

	/* PLAYFUL VARIANT */
	.block[variant="playful"] {
		background: rgb(var(--edu-first-accent) / 0.2);
		border: none;
		border-radius: 16px;
		color: rgb(var(--edu-inverted-ink));
		box-shadow: 5px 5px 0px rgba(var(--edu-shadow-color));
		transform: rotate(-1deg);
	}

	.block[variant="playful"]:hover {
		transform: translateY(-2px) rotate(-2deg);
		box-shadow: 0 6px 16px rgba(var(--edu-first-accent), 0.4);
	}

	/* OUTLINE VARIANT */
	.block[variant="outline"] {
		background: transparent;
		border: 2px solid rgb(var(--edu-first-accent));
		border-top: 6px solid rgb(var(--edu-first-accent));
		border-radius: 0;
	}

	.block[variant="outline"]:hover {
		background: rgb(var(--edu-first-accent) / 0.1);
		border-width: 3px;
	}

	/* LETTER VARIANT */
	.block[variant="letter"] {
		font-family: georgia, serif;
		background: rgb(var(--edu-card));
		border: 1px solid rgb(var(--edu-border));
		border-radius: 4px;
		box-shadow: inset 0 0 0 1px rgba(var(--edu-shadow-color), 0.05);
	}

	.block[variant="letter"]:hover {
		box-shadow:
			inset 0 0 0 1px rgba(var(--edu-shadow-color), 0.05),
			0 2px 6px rgba(var(--edu-shadow-color), 0.1);
	}

	/* MINIMAL VARIANT */
	.block[variant="minimal"] {
		background: rgb(var(--edu-card));
		border: 1px solid rgb(var(--edu-border));
		border-radius: 6px;
		padding: 0.75rem;
	}

	.block[variant="minimal"]:hover {
		border-color: rgb(var(--edu-first-accent) / 0.5);
		box-shadow: 0 1px 4px rgba(var(--edu-shadow-color), 0.1);
	}

	/* GLASS VARIANT */
	.block[variant="glass"] {
		background: rgba(var(--edu-card), 0.7);
		backdrop-filter: blur(10px);
		border: 2px solid rgba(var(--edu-border), 0.35);
		border-radius: 12px;
	}

	.block[variant="glass"]:hover {
		background: rgba(var(--edu-card), 0.85);
		border-color: rgba(var(--edu-first-accent), 0.5);
	}

	/* CARD VARIANT */
	.block[variant="card"] {
		background: rgb(var(--edu-card));
		border: 2px solid rgb(var(--edu-border));
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(var(--edu-shadow-color), 0.08);
	}

	.block[variant="card"]:hover {
		border-color: rgb(var(--edu-first-accent));
		box-shadow: 0 4px 12px rgba(var(--edu-shadow-color), 0.12);
	}

	/* SIGN VARIANT */
	.block[variant="sign"] {
		background: rgb(var(--edu-card));
		border: 4px double rgb(var(--edu-border));
		border-radius: 0;
		text-align: center;
		text-transform: uppercase;
		letter-spacing: 2px;
		font-weight: 700;
	}

	.block[variant="sign"]:hover {
		border-color: rgb(var(--edu-first-accent));
		background: rgb(var(--edu-first-accent) / 0.05);
	}

	/* EMPTY VARIANT */
	.block[variant="empty"] {
		background: transparent;
		border: 3px solid rgb(var(--edu-ink));
		border-radius: 0;
		padding: 0.75rem;
	}

	.block[variant="empty"]:hover {
		background: rgb(var(--edu-muted));
		border-color: rgb(var(--edu-ink));
	}
</style>
<div class="block" part="block">
	<slot></slot>
</div>
`;

export class EduBlock extends HTMLElement {

	static get observedAttributes() { return ["variant"]; }

	private $wrapEl!: HTMLDivElement;
	private $blockEl!: HTMLDivElement;

	constructor() {
		super();
		this.attachShadow({ mode: "open" });

		const wrap = document.createElement("div");
		wrap.className = '';
		wrap.innerHTML = HTML;

		this.shadowRoot.append(wrap);

		this.$wrapEl = wrap;
		this.$blockEl = wrap.querySelector('.block') as HTMLDivElement;
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

	public getBlock() { return this.$wrapEl };

	get variant(): Variant {
		return (this.getAttribute("variant") ?? "outline") as Variant;
	}

	set variant(v: Variant) { this.setAttribute("variant", v); }

	public removeSelf() { this.remove(); } 
}

if (!customElements.get("edu-block")) customElements.define("edu-block", EduBlock);
