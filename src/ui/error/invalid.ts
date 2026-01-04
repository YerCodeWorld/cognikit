/**
 * A simple error screen
 *
 */

export class ErrorScreen extends HTMLDivElement {

	static get observedAttributes() {
		return ["message", "icon"]
	}

	private $icon!: HTMLSpanElement;
	private $messageContainer!: HTMLDivElement;

	constructor(message: string) {

		super();
		this.attachShadow({ mode: "open" });

		this.innerHTML = `
			<style>
				.container { display: flex; justify-content: center; margin: 1rem; }
				.message {}
				.icon {}
			</style>
			<div class="container" part="container">
				<header>
					<div class="message" part="message"></div>
					<span class="icon" part="icon"></span>
				</header>
				<slot></slot>
			</div>
		`;
		
		this.$icon = this.querySelector(".icon");
		this.$message = this.querySelector(".message");
	}

	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if (oldValue === newValue) return;

		if (name === 'icon') {
			this.$icon.innerHTML = this.getAttribute("icon");
		}

		if (name === 'message') {
			this.$message.textContent = this.getAttribute("message");
		}
	}
}

if (!customElements.get("edu-error")) customElements.define("edu-error", ErrorScreen);
