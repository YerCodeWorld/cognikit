import HTML from "./index.html";
import CSS from "./styles.css";

import { Variant, ResponseObjectModality } from "../../../shared";
import { NormalizedAssets } from "../../../shared/assets";
import { GradingState } from "../../../types/Grading";

import { AnimationsManager } from "../../../shared/managers";
import { EduDialog } from "../dialog";

type ChipDisplayMode = 'in-line' | 'dialog';

/**
 * The key is expected to be something like "@:name", where string[2:] is expected to be a reference to 
 * a key in assets.
 */
export function setUpChipData(key: string, chip: EduChip, assets?: NormalizedAssets["assetsById"]): void {
	// lazy work, if the set up is messed up set exactly that as the content
	if (!assets || !key.startsWith("@:") || key.length < 3) {
		chip.textContent = key;
		return;
	};

	const ref = key.slice(2, key.length);
	if (!assets[ref]) { 
		chip.textContent = ref;
		return;
	};

	const asset = assets[ref];
	const modality = asset.type;

	chip.modality = modality;

	switch (modality) {
		case "image":
			chip.data = asset.url;
			break;
		
		case "video":
			break;
		case "audio":
			break;

		case "html":
			chip.data = asset.content;
			break;
	}

}

export class EduChip extends HTMLElement {
	
	// accent not implemtended yet 
	static get observedAttributes() {
		return ["accent", "variant", "selected", "prefix", "disabled", "modality", "state", "display", "color", "colored", "draggable"];
	}
	
	private $chip!: HTMLButtonElement;
	private $prefix!: HTMLSpanElement;
	private $dragHandler!: HTMLSpanElement;
	private $dialog!: EduDialog;
	
	constructor() {
		super();
		this.attachShadow({ mode: "open" });

		this.shadowRoot!.innerHTML = HTML;
		const style = document.createElement("style");
		style.textContent = CSS;
		this.shadowRoot!.append(style);

		this.$prefix = this.shadowRoot!.querySelector(".prefix");
		this.$chip = this.shadowRoot!.querySelector(".content-zone");
		this.$dragHandler = this.shadowRoot!.querySelector(".drag-handle");

		this.$dialog = new EduDialog();

		AnimationsManager.injectKeyframes(this.shadowRoot!);
	}

	connectedCallback() {
		if (!this.hasAttribute("variant")) this.variant = "outline";
		this.sync();
	}

	attributeChangedCallback() { this.sync(); }

	public getButton() { return this.$chip };
	public getPrefix() { return this.$prefix };
	public getDragHandler() { return this.$dragHandler; };

	private sync() {
		if (this.hasAttribute("prefix")) {
			this.$prefix.textContent = this.prefix ?? "";
		}

		if (this.hasAttribute("draggable")) {
			this.style.userSelect = "none";
			this.style.touchAction = "none";
		}

		const pressed = this.selected ? "true" : "false";
		this.$chip.setAttribute("aria-pressed", pressed);

	}

	private updateContent() {
		if (!this.hasAttribute("data") || !this.hasAttribute("modality")) return;

		const modality = this.getAttribute("modality");
		const data = this.getAttribute("data");

		switch (modality) {
			case "image":
				this.innerHTML = `<img src="${data}" alt="no image" class="chip-image" width="64" height="64"/>`;
				break;

			case "audio":
				break;

			case "video":
				break;

			case "html":
				this.innerHTML = data;
		}
	}

	get variant(): Variant {
		return (this.getAttribute("variant") ?? "outline") as Variant;
	}
	set variant(v: Variant) { this.setAttribute("variant", v); }

	get prefix(){ return this.getAttribute("prefix"); }
	set prefix(v){
		if (v === null || v === undefined || v === "") this.removeAttribute("prefix");
		else this.setAttribute("prefix", String(v));
	}
	
	get chipState() { return this.getAttribute("state") as GradingState; }
	set chipState(v: GradingState) {
		if (v === null || v === undefined) this.removeAttribute("state");
		else this.setAttribute("state", String(v));
	}
	
	get draggable() { return this.hasAttribute("draggable"); }
	set draggable(v) {
		if (v === null || v === undefined || v === false) this.removeAttribute("draggable");		
		else { 	
			this.setAttribute("draggable", "true");
		}
	}
	
	get color() { return this.getAttribute("color"); }
	set color(v: string) {
		if (v === null || v === undefined || v === "") this.removeAttribute("color");		
		else { 
			this.setAttribute("color", String(v));
			this.style.setProperty("--chip-colored-color", String(v));
		}
	}
	
	get colored() { return this.hasAttribute("colored"); }
	set colored(v) {
		if (v) { this.setAttribute("colored", "true"); }
		else { this.removeAttribute("colored"); }
	}

	set data(v: string) {
		if (v === null || v === undefined || v === "") this.removeAttribute("data");		
		else { 
			this.setAttribute("data", String(v))
			this.updateContent();
		};
	}

	set modality(v: ResponseObjectModality) {
		if (v === null || v === undefined) this.removeAttribute("modality");		
		else {
			console.log(1);
			this.setAttribute("modality", String(v));
			this.updateContent();
		}
	}

	get disabled(){ return this.hasAttribute("disabled"); }
	set disabled(v){
		if (v) {
			this.setAttribute("aria-disabled", 'true');
			this.$chip.setAttribute("aria-disabled", 'true');
			this.$dragHandler.setAttribute("aria-disabled", 'true');
		} else {
			this.removeAttribute("aria-disabled");
			this.$chip.removeAttribute("aria-disabled");
			this.$dragHandler.removeAttribute("aria-disabled");
		}
	}

	get selected(){ return this.hasAttribute("selected"); }
	set selected(v){
		if (v) this.setAttribute("selected", "");
		else this.removeAttribute("selected");
	}
		
	get value(){ return this.getAttribute("value") ?? ""; }
	set value(v){ this.setAttribute("value", String(v)); }
	
	toggle(force?: boolean){
		if (typeof force === "boolean") this.selected = force;
		else this.selected = !this.selected;
		return this.selected;
	}

	public removeSelf() { this.remove(); } 
	
}

if (!customElements.get("edu-chip")) customElements.define("edu-chip", EduChip);
