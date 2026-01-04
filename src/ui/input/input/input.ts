import { Variant } from "../../../shared/types";

/**
 * This is supposed to be a skin layer for the native input elements so that they are more in sync with out 'variants' system.
 * It needs check out and I don't know if they styles in the attribute selectors will apply to all input elements types
 */ 

const CSS = `

/* --- SHARED BASE STYLES --- */
input, select, button {
	padding: 0.6rem 1rem;
	font-size: 1rem;
	transition: all 0.2s ease;
	border: 1px solid transparent;
	border-radius: 4px;
	outline: none;
}

/* --- VARIANTS --- */

:host([variant="elegant"]) {
	border-radius: 0;
	border-right: 2px solid rgb(var(--edu-first-accent));
	background: rgb(var(--edu-bg));
	letter-spacing: 1px;
	text-transform: uppercase;
	font-size: 0.8rem;
}

:host([variant="playful"]) {
	border-radius: 50px;
	background: rgb(var(--edu-first-accent) / 0.7);
	border: 2px solid rgb(var(--edu-first-accent));
	font-weight: bold;
	color: rgb(var(--edu-inverted-ink));
}
:host([variant="playful"]):active { transform: scale(0.95); }

:host([variant="outline"]) {
	background: transparent;
	border: 2px solid rgb(var(--edu-first-accent));
	color: rgb(var(--edu-first-accent));
}
:host([variant="outline"]):hover { background: rgb(var(--edu-bg)); color: white; }

:host([variant="letter"]) {
	background: rgb(var(--edu-card));
	border: 1px solid rgb(var(--edu-muted));
	font-family: georgia, serif;
	font-style: italic;
	box-shadow: 2px 2px 0px rgb(var(--edu-muted));
}

:host([variant="sign"]) {
	background: rgb(var(--edu-bg));
	font-weight: 800;
	text-transform: uppercase;
	border-radius: 4px;
}

:host([variant="minimal"]) {
	background: rgb(var(--edu-bg));
	border: 1px solid rgb(var(--edu-border));
}

.card-glass { background: linear-gradient(135deg, #6366f1, #a855f7); color: white; }
[data-variant="glass"] {
	background: rgba(255, 255, 255, 0.2);
	backdrop-filter: blur(10px);
	border: 1px solid rgba(255, 255, 255, 0.3);
	color: white;
}
:host([variant="glass"]) option { color: black; }

:host([variant="empty"]) {
	background: transparent;
	border: 2px solid rgb(var(--edu-border));
}
:host([variant="empty"]):hover, [variant="empty"]:focus { border-style: solid; }
`;

export class EduInput extends HTMLInputElement {

	static get observedAttributes() {
		return ["variant"];
	}

	constructor() {
		super();

		this.attachShadow({ mode: "open" });
		const styleEl = document.createElement("style");
		styleEl.textContent = CSS;
		this.shadowRoot!.append(styleEl);
	}

	attributeChangedCallback() {}

}

if (!customElements.get("edu-input")) customElements.define("edu-input", EduInput);

