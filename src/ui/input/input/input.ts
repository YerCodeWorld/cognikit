import { Variant } from "../../../shared/types";

/**
 * Skin wrapper for native form controls (input/select/textarea/button).
 * It applies the variant system via host selectors and styles slotted controls.
 */

const CSS = `
:host {
	display: inline-flex;
	align-items: center;
	width: auto;
	font-family: inherit;
	color: rgb(var(--edu-ink));
}

/* --- SHARED BASE STYLES --- */
.control {
	width: 100%;
	box-sizing: border-box;
	padding: 0.6rem 1rem;
	font-size: 1rem;
	transition: all 0.2s ease;
	border: 1px solid rgb(var(--edu-border));
	border-radius: 4px;
	outline: none;
	background: rgb(var(--edu-bg));
	color: rgb(var(--edu-ink));
	font-family: inherit;
}

.control:focus {
	border-color: rgb(var(--edu-first-accent));
	box-shadow: 0 0 0 2px rgb(var(--edu-first-accent) / 0.2);
}

.control[type="checkbox"],
.control[type="radio"] {
	width: 18px;
	height: 18px;
	padding: 0;
	accent-color: rgb(var(--edu-first-accent));
}

button.control {
	cursor: pointer;
}

slot {
	display: none;
}

:host([disabled]) .control {
	opacity: 0.6;
	cursor: not-allowed;
}

/* --- VARIANTS --- */

:host([variant="elegant"]) .control {
	border-radius: 0;
	border-bottom: 2px solid rgb(var(--edu-first-accent));
	background: rgb(var(--edu-card));
	letter-spacing: 1px;
	text-transform: uppercase;
	font-size: 0.8rem;
}

:host([variant="playful"]) .control {
	border-radius: 50px;
	background: rgb(var(--edu-first-accent) / 0.7);
	border: 2px solid rgb(var(--edu-first-accent));
	font-weight: 700;
	color: rgb(var(--edu-inverted-ink));
}

:host([variant="outline"]) .control {
	background: transparent;
	border: 2px solid rgb(var(--edu-first-accent));
	color: rgb(var(--edu-ink));
}

:host([variant="letter"]) .control {
	background: rgb(var(--edu-card));
	border: 1px solid rgb(var(--edu-muted));
	font-family: georgia, serif;
	font-style: italic;
	box-shadow: 2px 2px 0 rgb(var(--edu-muted));
}

:host([variant="sign"]) .control {
	background: rgb(var(--edu-bg));
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 2px;
	border-radius: 4px;
}

:host([variant="minimal"]) .control {
	background: rgb(var(--edu-bg));
	border: 1px solid rgb(var(--edu-border));
}

:host([variant="glass"]) .control {
	background: rgba(var(--edu-card), 0.7);
	backdrop-filter: blur(10px);
	border: 2px solid rgba(var(--edu-border), 0.35);
}

:host([variant="empty"]) .control {
	background: transparent;
	border: 2px solid rgb(var(--edu-border));
}

/* --- STATE FEEDBACK --- */
:host([state="correct"]) .control {
	border: 2px solid rgb(var(--edu-success));
	background: rgb(var(--edu-success) / 0.1);
	box-shadow: 0 0 0 2px rgb(var(--edu-success) / 0.2);
}

:host([state="wrong"]) .control {
	border: 2px solid rgb(var(--edu-error));
	background: rgb(var(--edu-error) / 0.1);
	box-shadow: 0 0 0 2px rgb(var(--edu-error) / 0.2);
}

:host([state="missed"]) .control {
	border: 2px solid rgb(var(--edu-warning));
	background: rgb(var(--edu-warning) / 0.1);
	box-shadow: 0 0 0 2px rgb(var(--edu-warning) / 0.2);
}
`;

const ALLOWED_TAGS = ["input", "select", "textarea", "button"] as const;
type AllowedTag = (typeof ALLOWED_TAGS)[number];

type NativeControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement;

export class EduInput extends HTMLElement {
	// state: GradingState from "types/Grading"
	static get observedAttributes() {
		return [
			"as",
			"variant",
			"state",
			"disabled",
			"readonly",
			"required",
			"placeholder",
			"value",
			"type",
			"name",
			"autocomplete",
			"min",
			"max",
			"step",
			"pattern",
			"rows",
			"cols",
			"multiple",
			"size"
		];
	}

	private $slot: HTMLSlotElement | null = null;
	private controlEl: NativeControl | null = null;
	private currentTag: AllowedTag = "input";

	constructor() {
		super();

		this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		if (!this.hasAttribute("variant")) this.variant = "outline";
		this.render();
		this.$slot?.addEventListener("slotchange", this.handleSlotChange);
		this.syncAttributes();
		this.syncContent();
	}

	disconnectedCallback() {
		this.$slot?.removeEventListener("slotchange", this.handleSlotChange);
	}

	attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
		if (oldValue === newValue) return;
		if (name === "as") {
			this.render();
		}
		this.syncAttributes();
		this.syncContent();
	}

	private handleSlotChange = () => {
		this.syncAttributes();
		this.syncContent();
	};

	private getTag(): AllowedTag {
		const as = (this.getAttribute("as") ?? "input").toLowerCase();
		if (ALLOWED_TAGS.includes(as as AllowedTag)) return as as AllowedTag;
		return "input";
	}

	private render() {
		const tag = this.getTag();
		if (this.controlEl && this.currentTag === tag) return;

		this.currentTag = tag;
		this.shadowRoot!.innerHTML = "";

		const styleEl = document.createElement("style");
		styleEl.textContent = CSS;
		this.shadowRoot!.append(styleEl);

		const control = document.createElement(tag) as NativeControl;
		control.className = "control";
		control.setAttribute("part", "control");

		this.$slot = document.createElement("slot");

		this.shadowRoot!.append(control, this.$slot);
		this.controlEl = control;
	}

	private applyAttr(attr: string) {
		if (!this.controlEl) return;
		if (this.hasAttribute(attr)) {
			this.controlEl.setAttribute(attr, this.getAttribute(attr) ?? "");
		} else {
			this.controlEl.removeAttribute(attr);
		}
	}

	private applyBoolAttr(attr: string) {
		if (!this.controlEl) return;
		if (this.hasAttribute(attr)) {
			this.controlEl.setAttribute(attr, "");
		} else {
			this.controlEl.removeAttribute(attr);
		}
	}

	private syncAttributes() {
		if (!this.controlEl) return;

		this.applyBoolAttr("disabled");
		this.applyBoolAttr("readonly");
		this.applyBoolAttr("required");

		this.applyAttr("placeholder");
		this.applyAttr("name");
		this.applyAttr("autocomplete");
		this.applyAttr("min");
		this.applyAttr("max");
		this.applyAttr("step");
		this.applyAttr("pattern");

		if (this.controlEl instanceof HTMLInputElement) {
			this.applyAttr("type");
		}

		if (this.controlEl instanceof HTMLTextAreaElement) {
			this.applyAttr("rows");
			this.applyAttr("cols");
		}

		if (this.controlEl instanceof HTMLSelectElement) {
			this.applyBoolAttr("multiple");
			this.applyAttr("size");
		}

		if ("value" in this.controlEl) {
			if (this.hasAttribute("value")) {
				this.controlEl.value = this.getAttribute("value") ?? "";
			} else {
				this.controlEl.value = "";
			}
		}
	}

	private syncContent() {
		if (!this.controlEl || !this.$slot) return;
		const assigned = this.$slot.assignedNodes({ flatten: true });
		const filtered = assigned.filter((node) => {
			if (node.nodeType === Node.TEXT_NODE) {
				return node.textContent?.trim();
			}
			return node.nodeType === Node.ELEMENT_NODE;
		});

		if (this.controlEl instanceof HTMLSelectElement) {
			this.controlEl.innerHTML = "";
			filtered.forEach((node) => {
				if (node instanceof HTMLOptionElement || node instanceof HTMLOptGroupElement) {
					this.controlEl!.append(node.cloneNode(true));
				}
			});
			return;
		}

		if (this.controlEl instanceof HTMLButtonElement) {
			this.controlEl.innerHTML = "";
			filtered.forEach((node) => {
				this.controlEl!.append(node.cloneNode(true));
			});
			return;
		}

		if (this.controlEl instanceof HTMLTextAreaElement) {
			if (!this.hasAttribute("value")) {
				const text = filtered.map((node) => node.textContent ?? "").join("");
				this.controlEl.value = text;
			}
		}
	}

	get variant(): Variant {
		return (this.getAttribute("variant") ?? "outline") as Variant;
	}
	set variant(v: Variant) {
		this.setAttribute("variant", v);
	}

	get value(): string {
		if (this.controlEl && "value" in this.controlEl) return this.controlEl.value;
		return this.getAttribute("value") ?? "";
	}
	set value(v: string) {
		this.setAttribute("value", String(v));
	}
}

if (!customElements.get("edu-input")) customElements.define("edu-input", EduInput);
