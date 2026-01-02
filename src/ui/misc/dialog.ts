/**
 * EduDialog - Reusable modal dialog component
 * Used for displaying rich content from chips and other interactive elements
 */

const HTML = `
<style>
	:host {
		display: none;
		position: fixed;
		inset: 0;
		z-index: 9999;
		align-items: center;
		justify-content: center;
	}

	:host([open]) {
		display: flex;
	}

	.backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		animation: fadeIn 0.2s ease;
	}

	.dialog {
		position: relative;
		background: rgb(var(--edu-card));
		border-radius: 16px;
		max-width: min(90vw, 600px);
		max-height: min(90vh, 800px);
		width: 100%;
		box-shadow: 0 25px 50px -12px rgba(var(--edu-shadow-color), 0.5);
		display: flex;
		flex-direction: column;
		animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
		overflow: hidden;
	}

	.header {
		padding: 1.5rem;
		border-bottom: 2px solid rgb(var(--edu-border));
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-shrink: 0;
	}

	.header h3 {
		margin: 0;
		color: rgb(var(--edu-ink));
		font-size: 1.25rem;
		font-weight: 600;
	}

	.close-btn {
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 8px;
		color: rgb(var(--edu-third-ink));
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		background: rgb(var(--edu-muted));
		color: rgb(var(--edu-ink));
	}

	.content {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
		color: rgb(var(--edu-second-ink));
	}

	.content::-webkit-scrollbar {
		width: 8px;
	}

	.content::-webkit-scrollbar-track {
		background: rgb(var(--edu-muted));
		border-radius: 4px;
	}

	.content::-webkit-scrollbar-thumb {
		background: rgb(var(--edu-border));
		border-radius: 4px;
	}

	.content::-webkit-scrollbar-thumb:hover {
		background: rgb(var(--edu-third-ink));
	}

	.footer {
		padding: 1rem 1.5rem;
		border-top: 2px solid rgb(var(--edu-border));
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.footer button {
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		border: none;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.95rem;
	}

	.footer button.primary {
		background: rgb(var(--edu-first-accent));
		color: rgb(var(--edu-inverted-ink));
	}

	.footer button.primary:hover {
		filter: brightness(1.1);
		transform: translateY(-1px);
	}

	.footer button.secondary {
		background: rgb(var(--edu-muted));
		color: rgb(var(--edu-ink));
	}

	.footer button.secondary:hover {
		background: rgb(var(--edu-border));
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@media (max-width: 640px) {
		.dialog {
			max-width: 95vw;
			max-height: 95vh;
			border-radius: 12px;
		}

		.header, .content, .footer {
			padding: 1rem;
		}
	}
</style>

<div class="backdrop" part="backdrop"></div>
<div class="dialog" part="dialog">
	<div class="header" part="header">
		<h3 id="title"></h3>
		<button class="close-btn" part="close-btn" aria-label="Close dialog">
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6l8 8M14 6l-8 8"/>
			</svg>
		</button>
	</div>
	<div class="content" part="content">
		<slot></slot>
	</div>
	<div class="footer" part="footer" style="display: none;">
		<slot name="footer"></slot>
	</div>
</div>
`;

export class EduDialog extends HTMLElement {

	private $backdrop: HTMLDivElement;
	private $dialog: HTMLDivElement;
	private $title: HTMLHeadingElement;
	private $content: HTMLDivElement;
	private $footer: HTMLDivElement;
	private $closeBtn: HTMLButtonElement;

	static get observedAttributes() {
		return ['open', 'title'];
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot!.innerHTML = HTML;

		this.$backdrop = this.shadowRoot!.querySelector('.backdrop') as HTMLDivElement;
		this.$dialog = this.shadowRoot!.querySelector('.dialog') as HTMLDivElement;
		this.$title = this.shadowRoot!.querySelector('#title') as HTMLHeadingElement;
		this.$content = this.shadowRoot!.querySelector('.content') as HTMLDivElement;
		this.$footer = this.shadowRoot!.querySelector('.footer') as HTMLDivElement;
		this.$closeBtn = this.shadowRoot!.querySelector('.close-btn') as HTMLButtonElement;
	}

	connectedCallback() {
		this.$backdrop.addEventListener('click', () => this.close());
		this.$closeBtn.addEventListener('click', () => this.close());

		// Close on Escape key
		document.addEventListener('keydown', this.handleEscape);

		// Check if footer slot has content
		const footerSlot = this.shadowRoot!.querySelector('slot[name="footer"]') as HTMLSlotElement;
		footerSlot.addEventListener('slotchange', () => {
			const hasFooterContent = footerSlot.assignedNodes().length > 0;
			this.$footer.style.display = hasFooterContent ? 'flex' : 'none';
		});
	}

	disconnectedCallback() {
		document.removeEventListener('keydown', this.handleEscape);
	}

	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if (name === 'title') {
			this.$title.textContent = newValue || '';
		} else if (name === 'open' && newValue !== oldValue) {
			if (this.hasAttribute('open')) {
				document.body.style.overflow = 'hidden';
			} else {
				document.body.style.overflow = '';
			}
		}
	}

	private handleEscape = (e: KeyboardEvent) => {
		if (e.key === 'Escape' && this.hasAttribute('open')) {
			this.close();
		}
	}

	open() {
		this.setAttribute('open', '');
		this.dispatchEvent(new CustomEvent('dialog:open', { bubbles: true, composed: true }));
	}

	close() {
		this.removeAttribute('open');
		this.dispatchEvent(new CustomEvent('dialog:close', { bubbles: true, composed: true }));
	}

	setContent(html: string) {
		this.$content.innerHTML = html;
	}

	get isOpen(): boolean {
		return this.hasAttribute('open');
	}

	get title(): string {
		return this.getAttribute('title') || '';
	}

	set title(value: string) {
		this.setAttribute('title', value);
	}
}

if (!customElements.get('edu-dialog')) {
	customElements.define('edu-dialog', EduDialog);
}
