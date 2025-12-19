import { Variant } from "../../shared/";

const HTML: string = `
	<style>
		:host {
			display: inline-block;
		}

		:host([prefix]) .prefix {
			display: inline-flex;
			margin-right: 0.5rem;
		}

		:host([selected]) button {
			box-shadow: 0 0 0 3px rgb(var(--edu-first-accent) / 0.3);
		}

		button {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			background: rgb(var(--edu-card));
			border: 1px solid rgb(var(--edu-border));
			padding: 0.5rem 1rem;
			cursor: pointer;
			font-size: 1rem;
			font-weight: 500;
			text-align: center;
			transition: all 0.2s ease;
			user-select: none;
			margin: 0.25rem;
			border-radius: var(--edu-radius);
			color: rgb(var(--edu-ink));
		}

		button:hover:not(:disabled) {
			transform: translateY(-1px);
			box-shadow: 0 2px 8px rgb(var(--edu-shadow-color) / 0.15);
		}

		button:active:not(:disabled) {
			transform: translateY(0);
		}

		button:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.prefix {
			display: none;
			font-weight: 600;
			color: rgb(var(--edu-second-ink));
		}

		.text {
			display: inline-flex;
			align-items: center;
		}

		/* ELEGANT VARIANT */
		:host([variant="elegant"]) {
			& button {
				border: 1px solid rgb(var(--edu-border));
				color: rgb(var(--edu-ink) / 0.80);
				border-radius: 4px;
				box-shadow: 2px 2px 0 rgb(var(--edu-border));
			}

			& button:hover:not(:disabled) {
				box-shadow: 1px 1px 0 rgb(var(--edu-border));
				transform: translate(1px, 1px);
			}

			& button:active:not(:disabled) {
				box-shadow: 0 0 0 rgb(var(--edu-border));
				transform: translate(2px, 2px);
			}

			& .prefix {
				color: rgb(var(--edu-first-accent));
			}
		}

		/* PLAYFUL VARIANT */
		:host([variant="playful"]) {
			& button {
				background: linear-gradient(45deg, rgb(var(--edu-first-accent)), rgb(var(--edu-first-accent) / 0.60));
				color: rgb(var(--edu-inverted-ink));
				border-radius: 12px;
				border: none;
				box-shadow: 0 4px 12px rgb(var(--edu-first-accent) / 0.3);
				font-weight: 600;
			}

			& button:hover:not(:disabled) {
				transform: translateY(-2px) rotate(-1deg);
				box-shadow: 0 6px 16px rgb(var(--edu-first-accent) / 0.4);
			}

			& button:active:not(:disabled) {
				transform: translateY(0) rotate(0deg);
			}

			& .prefix {
				color: rgb(var(--edu-inverted-ink));
				opacity: 0.9;
			}
		}

		/* OUTLINE VARIANT */
		:host([variant="outline"]) {
			& button {
				background: transparent;
				border: 2px solid rgb(var(--edu-first-accent));
				border-radius: 0;
				color: rgb(var(--edu-ink));
			}

			& button:hover:not(:disabled) {
				background: rgb(var(--edu-first-accent));
				border-color: rgb(var(--edu-inverted-ink));
				color: rgb(var(--edu-inverted-ink));
			}

			& button:active:not(:disabled) {
				background: rgb(var(--edu-border));
			}

			& .prefix {
				color: rgb(var(--edu-first-accent));
			}
		}

		/* EMPTY VARIANT */
		:host([variant="empty"]) {
			& button {
				background: transparent;
				border-radius: 0;
				color: rgb(var(--edu-ink));
				margin: 0;
				padding: 0.25rem 0.5rem;
				border: 3px solid rgb(var(--edu-ink));
			}

			& button:hover:not(:disabled) {
				background: rgb(var(--edu-muted));
				transform: none;
			}

			& button:active:not(:disabled) {
				background: rgb(var(--edu-border));
			}
		}

		/* LETTER VARIANT */
		:host([variant="letter"]) {
			& button {
				font-family: georgia, serif;
				border: 1px solid rgb(var(--edu-border));
				box-shadow: inset 0 0 0 1px rgba(var(--edu-shadow-color), 0.05);
				border-radius: 2px;
				background: rgb(var(--edu-card));
				color: rgb(var(--edu-ink));
				font-size: 0.95rem;
				letter-spacing: 0.5px;
			}

			& button:hover:not(:disabled) {
				box-shadow:
					inset 0 0 0 1px rgba(var(--edu-shadow-color), 0.05),
					0 2px 6px rgb(var(--edu-shadow-color) / 0.1);
			}

			& .prefix {
				font-family: georgia, serif;
				font-style: italic;
			}
		}

		/* MINIMAL VARIANT */
		:host([variant="minimal"]) {
			& button {
				background: rgb(var(--edu-card));
				border: 1px solid rgb(var(--edu-border));
				border-radius: 6px;
				color: rgb(var(--edu-ink));
				padding: 0.4rem 0.75rem;
				font-size: 0.9rem;
			}

			& button:hover:not(:disabled) {
				border-color: rgb(var(--edu-first-accent) / 0.5);
				box-shadow: 0 1px 4px rgb(var(--edu-shadow-color) / 0.1);
			}
		}

		/* GLASS VARIANT */
		:host([variant="glass"]) {
			& button {
				background: rgb(var(--edu-card));
				border: 2px solid rgb(var(--edu-border));
				border-radius: 0;
				color: rgb(var(--edu-ink));
				padding: 0.5rem 1.2rem;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 1.5px;
				font-size: 0.9rem;
			}

			& button:hover:not(:disabled) {
				background: rgb(var(--edu-first-accent));
				color: rgb(var(--edu-inverted-ink));
				border-color: rgb(var(--edu-first-accent));
			}

			& button:active:not(:disabled) {
				background: rgb(var(--edu-first-accent) / 0.9);
			}

			& .prefix {
				font-weight: 800;
			}
		}

		/* CARD VARIANT */
		:host([variant="card"]) {
			& button {
				background: transparent;
				border: 2px solid rgb(var(--edu-border));
				border-radius: 4px;
				color: rgb(var(--edu-ink));
			}

			& button:hover:not(:disabled) {
				background: rgb(var(--edu-muted));
				border-color: rgb(var(--edu-first-accent));
			}

			& button:active:not(:disabled) {
				background: rgb(var(--edu-border));
			}

			& .prefix {
				color: rgb(var(--edu-first-accent));
			}
		}

		/* SIGN VARIANT */
		:host([variant="sign"]) {
			& button {
				background: rgb(var(--edu-card));
				border-radius: 0;
				color: rgb(var(--edu-ink));
				padding: 0.5rem 1.2rem;
				font-size: 0.9rem;
				font-weigth: bold;
				transform: skewX(-10deg);
				text-transform: uppercase;
				letter-spacing: 0.2rem;
			}

			& button:hover:not(:disabled) {
				background: rgb(var(--edu-first-accent));
				color: rgb(var(--edu-inverted-ink));
				border-color: rgb(var(--edu-first-accent));
			}

			& button:active:not(:disabled) {
				background: rgb(var(--edu-first-accent) / 0.9);
			}

			& .prefix {
				font-weight: 800;
			}
		}

		/* SELECTED STATE ENHANCEMENTS PER VARIANT */
		:host([variant="elegant"][selected]) button {
			border-color: rgb(var(--edu-first-accent));
			background: rgb(var(--edu-first-accent) / 0.1);
		}

		:host([variant="playful"][selected]) button {
			box-shadow: 0 0 0 3px rgb(var(--edu-first-accent) / 0.4), 0 6px 16px rgb(var(--edu-first-accent) / 0.4);
		}

		:host([variant="outline"][selected]) button {
			background: rgb(var(--edu-first-accent) / 0.1);
			border-color: rgb(var(--edu-first-accent));
			border-width: 2px;
		}

		:host([variant="empty"][selected]) button {
			background: rgb(var(--edu-first-accent) / 0.15);
		}

		:host([variant="letter"][selected]) button {
			border-color: rgb(var(--edu-first-accent));
			background: rgb(var(--edu-muted));
		}

		:host([variant="minimal"][selected]) button {
			border-color: rgb(var(--edu-first-accent));
			background: rgb(var(--edu-first-accent) / 0.08);
		}

		:host([variant="glass"][selected]) button {
			background: rgba(var(--edu-first-accent), 0.15);
			border-color: rgb(var(--edu-first-accent));
		}

		:host([variant="card"][selected]) button {
			border-color: rgb(var(--edu-first-accent));
			box-shadow: 0 0 0 3px rgb(var(--edu-first-accent) / 0.2);
		}

		:host([variant="sign"][selected]) button {
			background: rgb(var(--edu-first-accent));
			color: rgb(var(--edu-inverted-ink));
			border-color: rgb(var(--edu-first-accent));
		}

	</style>
	<button part="button" type="button" aria-pressed="false">
		<span class="prefix" part="prefix"></span>
		<span class="text" part="text">
			<slot></slot>
		</span>
	</button>
`;

export class EduChip extends HTMLElement {
	
	static get observedAttributes() {
		return ["variant", "selected", "prefix", "disabled", "color"];
	}
	
	private $button!: HTMLButtonElement;
	private $prefix!: HTMLSpanElement;
	private $wrapEl!: HTMLDivElement;
	
	constructor() {
		super(); 
		this.attachShadow({ mode: "open" });

		const wrap = document.createElement("div");
		wrap.className = '';
		wrap.innerHTML = HTML; 

		this.shadowRoot.append(wrap);

		this.$wrapEl = wrap;
		this.$prefix = wrap.querySelector(".prefix");
		this.$button = wrap.querySelector("button");
	}

	connectedCallback() {
		if (!this.hasAttribute("variant")) this.variant = "outline";
		this.sync();
	}

	attributeChangedCallback() { this.sync(); }

	public getButton() { return this.$button };
	public getPrefix() { return this.$prefix };

	private sync() {
		if (this.hasAttribute("prefix")) {
			this.$prefix.textContent = this.prefix ?? "";
		}

		const pressed = this.selected ? "true" : "false";
		this.$button.setAttribute("aria-pressed", pressed);
	}

	// API
	get variant(): Variant {
		return (this.getAttribute("variant") ?? "outline") as Variant;
	}
	set variant(v: Variant) { this.setAttribute("variant", v); }

	get prefix(){ return this.getAttribute("prefix"); }
	set prefix(v){
		if (v === null || v === undefined || v === "") this.removeAttribute("prefix");
		else this.setAttribute("prefix", String(v));
	}

	get disabled(){ return this.hasAttribute("disabled"); }
	set disabled(v){
		if (v) this.setAttribute("disabled", "");
		else this.removeAttribute("disabled");
	}

	get selected(){ return this.hasAttribute("selected"); }
	set selected(v){
		if (v) this.setAttribute("selected", "");
		else this.removeAttribute("selected");
	}
		
	get value(){ return this.getAttribute("value") ?? ""; }
	set value(v){ this.setAttribute("value", String(v)); }
	
	/** Toggle selected state */
	toggle(force?: boolean){
		if (typeof force === "boolean") this.selected = force;
		else this.selected = !this.selected;
		return this.selected;
	}

	public removeSelf() { this.remove(); } 
	
}

if (!customElements.get("edu-chip")) customElements.define("edu-chip", EduChip);
