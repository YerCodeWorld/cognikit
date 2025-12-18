// letter-picker.ts

type Mode = "simple" | "grid";

const innerHTML = `

	<style>

	.letter-picker-wrapper { position: relative; }

	.letter-picker-wrapper .display {
	  cursor: pointer; 
	  padding: 16px 20px; 
	  color: rgb(var(--edu-first-accent)); 
	  outline: none;
	  user-select: none; 
	  font-size: 1.5rem;
	}

	.letter-picker-wrapper .display.placeholder { opacity: .6; }

	:host([mode="simple"]) .display { border-bottom: 2px solid rgb(var(--edu-border)); }
	:host([mode="simple"]:focus-within) .display { border-bottom-color: rgb(var(--edu-first-accent)); }

	:host([mode="box"]) .letter-picker-wrapper .display {
	  border: 2px solid rgb(var(--edu-border)); border-radius: 8px; min-width: 60px;
	  text-align: center; 
	  background: rgb(var(--edu-bg)); 
	  box-shadow: 0 2px 6px rgb(var(--edu-muted));
	}

	:host([mode="box"]:focus-within) .display { 
	  border-color: rgb(var(--edu-first-accent)); 
	}

	.letter-picker-wrapper .picker {
	  position: absolute; 
	  top: calc(100% + 6px); 
	  left: 0; 
	  display: none;
	  grid-template-columns: repeat(7, 1fr); 
	  gap: 4px; 
	  padding: 8px;
	  background: rgb(var(--edu-bg)); 
	  border: 1px solid rgb(var(--edu-border)); 
	  border-radius: 8px;
	  box-shadow: 0 6px 14px rgb(var(--edu-muted));
	  z-index: 1000;
	}

	.letter-picker-wrapper .picker button {
	  border: none;   
	  background: rgb(var(--edu-card)); 
	  color: rgb(var(--edu-ink));
	  padding: 6px; 
	  border-radius: 4px;
	  cursor: pointer; 
	  font-weight: 700;
	}

	.letter-picker-wrapper .picker button:hover, .letter-picker-wrapper .picker button:focus {   
	  background: rgb(var(--edu-first-accent)); 
	  color: rgb(var(--edu-ink)); 
	  outline: none; 
	}
	</style>

	<div class="letter-picker-wrapper" id="wrap">
	  <div class="display" id="display" part="display" role="button" aria-haspopup="listbox" aria-expanded="false" tabIndex="0"></div>
	  <div class="picker" id="picker" part="picker" role="listbox">
	</div>


`;

export class LetterPicker extends HTMLElement {

  static get observedAttributes() {
    return ["value", "mode", "placeholder", "disabled"] as const;
  }

  private _open = false;
  private _display!: HTMLElement;
  private _picker!: HTMLElement;

  // Bound handlers so add/removeEventListener use the same fn refs
  private _onDocClick = (e: Event) => {
    const path = (e.composedPath && e.composedPath()) || [];
    if (!path.includes(this)) this.close();
  };

  private _onDocKey = (e: KeyboardEvent) => {
    if (!this._open) return;
    if (e.key === "Escape") {
      e.stopPropagation();
      this.close();
      (this._display as HTMLElement).focus?.();
      return;
    }
    // Quick type-to-select: A–Z picks and closes
    if (/^[a-z]$/i.test(e.key)) {
      const letter = e.key.toUpperCase();
      const btn = this._picker.querySelector<HTMLButtonElement>(`button[data-letter="${letter}"]`);
      if (btn) {
        this.value = letter;
        this.close();
        this.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  };

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = innerHtml;

    this._display = root.getElementById("display") as HTMLElement;
    this._picker = root.getElementById("picker") as HTMLElement;

    // Build A–Z once
    for (let i = 65; i <= 90; i++) {
      const letter = String.fromCharCode(i);
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = letter;
      b.dataset.letter = letter;
      b.setAttribute("role", "option");
      b.addEventListener("click", () => {
        this.value = letter;
        this.close();
        this.dispatchEvent(new Event("change", { bubbles: true }));
      });
      this._picker.appendChild(b);
    }

    // Toggle/open/close
    this._display.addEventListener("click", () => this.toggle());
    this._syncDisplay();
  }

  // Attributes ↔ properties
  get placeholder(): string | null {
    return this.getAttribute("placeholder");
  }
  set placeholder(v: string | null) {
    if (v == null) this.removeAttribute("placeholder");
    else this.setAttribute("placeholder", v);
  }

  get mode(): Mode {
    return (this.getAttribute("mode") as Mode) ?? "simple";
  }
  set mode(v: Mode) {
    this.setAttribute("mode", v ?? "simple");
  }

  get value(): string {
    return (this.getAttribute("value") || "").toUpperCase();
  }
  set value(v: string) {
    const clean = (v || "").toUpperCase().replace(/[^A-Z]/g, "");
    this.setAttribute("value", clean);
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }
  set disabled(v: boolean) {
    if (v) this.setAttribute("disabled", "");
    else this.removeAttribute("disabled");
    this._display.setAttribute("aria-disabled", v ? "true" : "false");
  }

  connectedCallback() {
    // Upgrade pre-defined properties
    this._upgradeProperty("placeholder");
    this._upgradeProperty("mode");
    this._upgradeProperty("value");
    this._upgradeProperty("disabled");

    if (!this.hasAttribute("mode")) this.mode = "simple";
    this._syncDisplay();

    // Keyboard support on the host
    this.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  disconnectedCallback() {
    this.close();
  }

  attributeChangedCallback(name: string) {
    if (name === "value" || name === "placeholder") this._syncDisplay();
    if (name === "disabled" && this.disabled) this.close();
  }

  // Public API
  open() {
    if (this._open || this.disabled) return;
    this._picker.style.display = "grid";
    this._display.setAttribute("aria-expanded", "true");
    document.addEventListener("click", this._onDocClick, true);
    document.addEventListener("keydown", this._onDocKey);
    this._open = true;
  }

  close() {
    if (!this._open) return;
    this._picker.style.display = "none";
    this._display.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", this._onDocClick, true);
    document.removeEventListener("keydown", this._onDocKey);
    this._open = false;
  }

  toggle() {
    this._open ? this.close() : this.open();
  }

  // Helpers
  private _syncDisplay() {
    const val = this.value;
    const ph = this.placeholder || "Pick a letter";
    this._display.textContent = val || ph;
    this._display.classList.toggle("placeholder", !val);
  }

  private _upgradeProperty(prop: keyof LetterPicker) {
    
    if (Object.prototype.hasOwnProperty.call(this, prop)) {
      
      const value = this[prop];
      
      delete this[prop];
      // @ts-expect-error: restore via setter
      this[prop] = value;
    }
  }
}

if (!customElements.get('letter-picker')) customElements.define('letter-picker', LetterPicker);
