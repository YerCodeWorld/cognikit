type EduTextElement = HTMLElement & {
	
	getValue(): void;
	getState(): void;

	reset(): void;
}

// to be ignored
type TextEngineSpec = {
	immediateFeedback?: Boolean;
}

export class EduText extends HTMLElement implements EduTextElement {
	
	private _config: TextEngineSpec;
	private _state = null;
	private _mounted = false;

	static get observedAttributes() {
		return  ["variant"];
	}

	private $wrapEl!: HTMLElement;

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });

		const wrap = document.createElement("section");
		wrap.className = "wrap";
		this.shadowRoot.append(wrap);

		this.$wrapEl = wrap;
	}
	
	connectedCallback() {
		this._mounted = true;
		this.render();
	}
	
	disconnectedCallback() {
		this._mounted = false;
	}

	private render() {}

	getValue() {}
	getState() {}
	reset() {}

}

if (!customElements.get('edu-text')) customElements.define('edu-text', EduText);
