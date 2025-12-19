
type ColorItem = { name: string; hex: string };
type PaletteMap = Record<string, ColorItem[]>;

const baseHTML = `
	
 <style>
  :host { 
    /* Custom Props here, when you are not lazy enough to add them */
    font-family: system-ui, sans-serif; 
  }
  
  .wrap { position: relative; display: inline-block; }
  
  button.swatch {
    width: 38px; 
    height: 32px; 
    border-radius: 8px; 
    border: 1px solid #ccc;
    box-shadow: 0 1px 2px rgba(0,0,0,.08); 
    cursor: pointer;
  }
  
  .tooltip {
    position: absolute; 
    z-index: 1000; 
    top: 110%; 
    left: 0;
    min-width: 220px; 
    background: #fff; 
    border: 1px solid #e5e7eb;
    border-radius: 10px; 
    box-shadow: 0 12px 30px rgba(0,0,0,.12);
    padding: 10px; display: none;
  }
  
  .tooltip.open { display: block; }
  
  header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    gap: 8px; 
  }
  
  header .name { font-size: 0.9rem; font-weight: 600; }
  
  .grid {
    display: grid; 
    grid-template-columns: repeat(6, 1fr); 
    gap: 8px; 
    padding: 10px 0;
  }
  .opt {
    width: 28px; 
    height: 28px; 
    border-radius: 6px; 
    border: 1px solid #d1d5db;
    cursor: pointer;
  }
  .opt[aria-selected="true"] { outline: 2px solid #111827; outline-offset: 1px; }
  
  footer { display: flex; gap: 6px; flex-wrap: wrap; }
  footer .tab {
    padding: 6px 10px; 
    border-radius: 999px; 
    border: 1px solid #e5e7eb; 
    background: #f9fafb;
    cursor: pointer; 
    font-size: .85rem;
  }
  footer .tab.active { 
    background: #111827; 
    color: white; 
    border-color: #111827; 
  } 
</style>
    
<div class="wrap">
  <button class="swatch" title="Open color picker"></button>
  <div class="tooltip" role="dialog" aria-label="Choose a color">
    <header>
      <div class="name"></div>
      <div class="chip" style="width:18px;height:18px;border-radius:4px;border:1px solid #d1d5db;"></div>
    </header>
    <div class="grid"></div>
    <footer class="tabs"></footer>
  </div>
</div>

`;

export class ColorPicker extends HTMLElement {
  static get observedAttributes() { return ["value"]; }

  // Backing fields
  private _palettes: PaletteMap = {
    light: [
      { name: "Red", hex: "#ef4444" }, { name: "Orange", hex: "#f97316" },
      { name: "Yellow", hex: "#f59e0b" }, { name: "Beige", hex: "#f5f5dc" },
      { name: "Green", hex: "#22c55e" }, { name: "Blue", hex: "#3b82f6" },
      { name: "Purple", hex: "#8b5cf6" }, { name: "Pink", hex: "#ec4899" },
      { name: "Brown", hex: "#a16207" }, { name: "Gray", hex: "#9ca3af" },
      { name: "Black", hex: "#000000" }, { name: "White", hex: "#ffffff" }
    ],
    dark: [
      { name: "Dark Red", hex: "#991b1b" }, { name: "Dark Orange", hex: "#9a3412" },
      { name: "Gold", hex: "#b45309" }, { name: "Khaki", hex: "#bdb76b" },
      { name: "Dark Green", hex: "#166534" }, { name: "Dark Blue", hex: "#1e3a8a" },
      { name: "Indigo", hex: "#4338ca" }, { name: "Magenta", hex: "#9d174d" },
      { name: "Dark Brown", hex: "#78350f" }, { name: "Dark Gray", hex: "#4b5563" },
      { name: "Near Black", hex: "#111827" }, { name: "Ivory", hex: "#fffff0" }
    ],
  };
  private _activePaletteKey: string = Object.keys(this._palettes)[0];
  private _value: ColorItem = this._palettes[this._activePaletteKey][0];

  // Refs
  private $wrap!: HTMLDivElement;
  private $swatch!: HTMLButtonElement;
  private $tooltip!: HTMLDivElement;
  private $name!: HTMLSpanElement;
  private $chip!: HTMLSpanElement;
  private $grid!: HTMLDivElement;
  private $tabs!: HTMLDivElement;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    const root = document.createElement("div");
    root.innerHTML = baseHTML;
    this.shadowRoot!.append(root);

    // refs
    this.$wrap = this.shadowRoot!.querySelector(".wrap") as HTMLDivElement;
    this.$swatch = this.shadowRoot!.querySelector(".swatch") as HTMLButtonElement;
    this.$tooltip = this.shadowRoot!.querySelector(".tooltip") as HTMLDivElement;
    this.$name = this.shadowRoot!.querySelector(".name") as HTMLSpanElement;
    this.$chip = this.shadowRoot!.querySelector(".chip") as HTMLSpanElement;
    this.$grid = this.shadowRoot!.querySelector(".grid") as HTMLDivElement;
    this.$tabs = this.shadowRoot!.querySelector(".tabs") as HTMLDivElement;

    // events
    this.$swatch.addEventListener("click", () => this.toggle());
    document.addEventListener("click", (e: MouseEvent) => {
      const tgt = e.target as (Node | null);
      if (tgt && !this.contains(tgt) && !this.shadowRoot?.contains(tgt)) this.close();
    });
  }

  // Public API
  get palettes(): PaletteMap { return this._palettes; }
  set palettes(obj: PaletteMap) {
    if (obj && typeof obj === "object" && Object.keys(obj).length) {
      this._palettes = obj;
      this._activePaletteKey = Object.keys(obj)[0];
      this._value = obj[this._activePaletteKey][0];
      this.render();
    }
  }

  get activePaletteKey(): string { return this._activePaletteKey; }
  set activePaletteKey(k: string) {
    if (k in this._palettes) this._activePaletteKey = k;
  }

  get value(): ColorItem { return this._value; }
  set value(v: ColorItem) {
    if (v && v.hex) {
      this._value = v;
      this.updateHeader();
      this.updateSwatch();
      this.markSelected();
      this.dispatch();
    }
  }

  attributeChangedCallback(name: string, _old: string | null, val: string | null) {
    if (name === "value" && val) {
      try {
        const v = JSON.parse(val) as ColorItem;
        if (v && v.hex) this.value = v;
      } catch { /* ignore bad JSON */ }
    }
  }

  connectedCallback() { this.render(); }

  // UI
  private render() {
    this.renderTabs();
    this.renderGrid();
    this.updateHeader();
    this.updateSwatch();
    this.markSelected();
  }

  private renderTabs() {
    this.$tabs.innerHTML = "";
    Object.keys(this._palettes).forEach((key) => {
      const b = document.createElement("button");
      b.className = "tab" + (key === this._activePaletteKey ? " active" : "");
      b.textContent = key;
      b.addEventListener("click", () => {
        this.activePaletteKey = key;
        this.renderGrid();
        this.updateHeader();
        this.markSelected();
        this.$tabs.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
        b.classList.add("active");
      });
      this.$tabs.appendChild(b);
    });
  }

  private renderGrid() {
    this.$grid.innerHTML = "";
    const list = this._palettes[this._activePaletteKey] || [];
    list.forEach((item) => {
      const btn = document.createElement("button");
      btn.className = "opt";
      btn.style.background = item.hex;
      btn.title = `${item.name} (${item.hex})`;
      btn.setAttribute("role", "button");
      btn.addEventListener("click", () => { this.value = item; });
      this.$grid.appendChild(btn);
    });
  }

  private updateHeader() {
    const v = this._value || { name: "", hex: "#ffffff" };
    this.$name.textContent = v.name;
    this.$chip.style.background = v.hex;
  }

  private updateSwatch() {
    const v = this._value || { hex: "#ffffff" } as ColorItem;
    this.$swatch.style.background = v.hex;
  }

  private markSelected() {
    const v = this._value;
    this.$grid.querySelectorAll<HTMLButtonElement>(".opt").forEach((btn) => {
      btn.setAttribute(
        "aria-selected",
        btn.style.background.replace(/\s/g, "").toLowerCase() === (v?.hex || "").toLowerCase()
          ? "true"
          : "false"
      );
    });
  }

  private toggle() { this.$tooltip.classList.toggle("open"); }
  private close() { this.$tooltip.classList.remove("open"); }

  private dispatch() {
    this.dispatchEvent(new CustomEvent("colorchange", {
      bubbles: true,
      detail: { name: this._value.name, hex: this._value.hex, palette: this._activePaletteKey }
    }));
  }
}

if (!customElements.get('color-picker')) customElements.define("color-picker", ColorPicker);

