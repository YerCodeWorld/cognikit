import CSS from "./styles.css";

import {
	TextEngineConfiguration,
	TextEngineState,
	TextEngineDataUnion,
	TextEngineBaseData,
	TextEngineBlanksData,
	TextEngineClassificationData,

	EduTextChangeDetail,

	TextEngineGradingState
} from "../../types/Text";

import { EduBlock, EduInput } from "../../ui";

import { Variant } from "../../shared/types";
import { shuffle, escapeHtml, hash } from "../../shared/utils";

type EduTextElement = HTMLElement & {
	config: TextEngineConfiguration;

	getValue(): any;
	getState(): TextEngineState;
	setState(next: Partial<TextEngineState>): void;
	reset(): void;

	setGradingState(state: TextEngineGradingState): void;
	clearGradingState(): void;
};

export class EduText extends HTMLElement implements EduTextElement {

	private _config!: TextEngineConfiguration;
	private _state: TextEngineState = {};
	private _mounted = false;

	static get observedAttributes() {
		return ["variant"];
	}

	private $wrapEl!: HTMLElement;

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });

		const wrap = document.createElement("section");
		wrap.className = "wrap";
		this.shadowRoot!.append(wrap);

		this.$wrapEl = wrap;
	}

	connectedCallback() {
		this._mounted = true;
		this.shadowRoot?.addEventListener('click', this.onClick);
		this.shadowRoot?.addEventListener('change', this.onChange);
		this.shadowRoot?.addEventListener('input', this.onInput);
		this.shadowRoot?.addEventListener('dragstart', this.onDragStart);
		this.shadowRoot?.addEventListener('dragover', this.onDragOver);
		this.shadowRoot?.addEventListener('drop', this.onDrop);
		this.render();
	}

	disconnectedCallback() {
		this._mounted = false;
		this.shadowRoot?.removeEventListener('click', this.onClick);
		this.shadowRoot?.removeEventListener('change', this.onChange);
		this.shadowRoot?.removeEventListener('input', this.onInput);
		this.shadowRoot?.removeEventListener('dragstart', this.onDragStart);
		this.shadowRoot?.removeEventListener('dragover', this.onDragOver);
		this.shadowRoot?.removeEventListener('drop', this.onDrop);
	}

	set config(v: TextEngineConfiguration) {
		this._config = v;
		this._state = this.initState(v);
		if (v.variant) this.setAttribute('variant', v.variant);
		this.render();
	}

	get config() {
		if (!this._config) throw new Error('<edu-text>: config not set');
		return this._config;
	}

	getValue(): any {
		// Return user data in the format expected by graders
		const data = this._config.data;

		switch (data.type) {
			case 'base':
				if (this._config.mode === 'highlight') {
					return {
						selectedIndices: Array.from(this._state.selectedIndices ?? [])
					};
				} else if (this._config.mode === 'dnd') {
					const placements = this._state.dndPlacements ?? {};
					return {
						placedIndices: Object.keys(placements).map((k) => Number(k)),
						dndPlacements: { ...placements }
					};
				} else if (this._config.mode === 'transformation') {
					return {
						transformations: this._state.transformations ?? {}
					};
				}
				break;

			case 'blanks':
				return {
					inputValues: this._state.inputValues ?? {}
				};

			case 'classification':
				return {
					wordCategories: this._state.wordCategories ?? {}
				};
		}

		return {};
	}

	getState(): TextEngineState {
		return { ...this._state };
	}

	setState(next: Partial<TextEngineState>) {
		if (!next) return;

		this._state = {
			...this._state,
			...(next.selectedIndices ? { selectedIndices: new Set(next.selectedIndices) } : {}),
			...(next.dndPlacements ? { dndPlacements: { ...next.dndPlacements } } : {}),
			...(next.inputValues ? { inputValues: { ...next.inputValues } } : {}),
			...(next.wordCategories ? { wordCategories: { ...next.wordCategories } } : {}),
			...(next.transformations ? { transformations: { ...next.transformations } } : {})
		};

		this.render();
	}

	reset() {
		if (!this._config) return;
		this._state = this.initState(this._config);
		this.render();

		this.dispatchEvent(new CustomEvent('reset', {
			bubbles: true,
			composed: true
		}));
	}

	setGradingState(state: TextEngineGradingState) {
		if (!this._config) return;
		this._config.gradingState = state;
		this.render();
	}

	clearGradingState() {
		if (!this._config) return;
		this._config.gradingState = undefined;
		this.render();
	}

	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if (oldValue === newValue) return;

		if (name === 'variant') {
			this.setAttribute('variant', newValue);

			this.shadowRoot?.querySelectorAll('edu-input').forEach((el) => {
				const inputEl = el as EduInput;
				if (inputEl.variant !== undefined) {
					inputEl.variant = newValue as Variant;
				}
			});

			this.shadowRoot?.querySelectorAll('edu-block').forEach((el) => {
				const blockEl = el as EduBlock;
				if (blockEl.variant !== undefined) {
					blockEl.variant = newValue as Variant;
				}
			});

			// Update variant in all child elements if needed
			this.render();
		}
	}

	private upsertHtmlAttribute(html: string, attr: string, value: string): string {
		const attrPattern = new RegExp(`${attr}="[^"]*"`, "i");
		if (attrPattern.test(html)) {
			return html.replace(attrPattern, `${attr}="${value}"`);
		}
		return html.replace(/<([a-z0-9-]+)/i, `<$1 ${attr}="${value}"`);
	}

	private removeHtmlAttribute(html: string, attr: string): string {
		const attrPattern = new RegExp(`\\s${attr}="[^"]*"`, "ig");
		return html.replace(attrPattern, "");
	}

	private upsertHtmlClass(html: string, className: string): string {
		const classPattern = /class="([^"]*)"/i;
		if (classPattern.test(html)) {
			return html.replace(classPattern, (_m, cls) => {
				const existing = String(cls || "").split(/\s+/).filter(Boolean);
				if (!existing.includes(className)) existing.push(className);
				return `class="${existing.join(" ")}"`;
			});
		}
		return html.replace(/<([a-z0-9-]+)/i, `<$1 class="${className}"`);
	}

	private removeHtmlClassPrefix(html: string, prefix: string): string {
		const classPattern = /class="([^"]*)"/i;
		if (!classPattern.test(html)) return html;

		return html.replace(classPattern, (_m, cls) => {
			const filtered = String(cls || "")
				.split(/\s+/)
				.filter(Boolean)
				.filter((name) => !name.startsWith(prefix));
			return filtered.length > 0 ? `class="${filtered.join(" ")}"` : "";
		});
	}

	// ==================== INITIALIZATION ====================

	private initState(config: TextEngineConfiguration): TextEngineState {
		const state: TextEngineState = {};

		switch (config.data.type) {
			case 'base':
				if (config.mode === 'highlight' || config.mode === 'dnd') {
					state.selectedIndices = new Set<number>();
					if (config.mode === 'dnd') {
						state.dndPlacements = {};
					}
				} else if (config.mode === 'transformation') {
					state.transformations = {};
				}
				break;

			case 'blanks':
				state.inputValues = {};
				break;

			case 'classification':
				state.wordCategories = {};
				break;
		}

		return state;
	}

	// ==================== RENDERING ====================

	private render() {
		if (!this._mounted || !this.shadowRoot) return;

		if (!this._config) {
			this.$wrapEl.innerHTML = `<style>:host{display:block}</style><div></div>`;
			return;
		}

		const config = this._config;
		const data = config.data;

		let contentHtml = '';

		switch (config.mode) {
			case 'highlight':
				contentHtml = this.renderHighlight(data as TextEngineBaseData);
				break;
			case 'blanks':
				contentHtml = this.renderBlanks(data as TextEngineBlanksData);
				break;
			case 'classification':
				contentHtml = this.renderClassification(data as TextEngineClassificationData);
				break;
			case 'dnd':
				contentHtml = this.renderDND(data as TextEngineBaseData);
				break;
			case 'transformation':
				contentHtml = this.renderTransformation(data as TextEngineBaseData);
				break;
		}

		this.$wrapEl.innerHTML = `
			<style>${CSS}</style>
			<div class="text-content" part="content">
				${contentHtml}
			</div>
		`;
	}

	private renderHighlight(data: TextEngineBaseData): string {
		const parts = data.parts;
		const selectedIndices = this._state.selectedIndices ?? new Set();
		const gradingState = this._config.gradingState ?? {};

		return parts.map((word, index) => {
			const isSelected = selectedIndices.has(index);
			const grading = gradingState[index];

			let classes = ['word', 'word-selectable'];
			if (isSelected) classes.push('word-selected');
			if (grading) classes.push(`word-${grading}`);

			return `<span class="${classes.join(' ')}" data-index="${index}">${escapeHtml(word)}</span>`;
		}).join(' ');
	}

	private renderBlanks(data: TextEngineBlanksData): string {
		// Parts already contain HTML for input elements (generated by parser)
		// We just need to render them with proper state
		const gradingState = this._config.gradingState ?? {};
		const currentVariant = this.getAttribute("variant") ?? this._config.variant ?? "outline";

		return data.parts.map((part, index) => {
			// Check if this part is an input element (starts with <)
			if (part.startsWith('<')) {
				// Find the target for this part to get its ID
				const target = data.targets.find(t => t.expectedValue.html === part);
				if (target) {
					const grading = gradingState[target.id];
					const gradingClass = grading ? `input-${grading}` : '';

					// Inject grading class and current value if exists
					const value = this._state.inputValues?.[target.id] ?? '';
					let modifiedPart = part;

					// Ensure edu-input follows the active variant from host/config.
					if (/<edu-input\b/i.test(modifiedPart)) {
						modifiedPart = this.upsertHtmlAttribute(modifiedPart, "variant", currentVariant);
					}

					// Apply grading feedback:
					// - edu-input uses `state` attr
					// - native inputs/selects can use helper classes
					modifiedPart = this.removeHtmlClassPrefix(modifiedPart, "input-");
					modifiedPart = this.removeHtmlAttribute(modifiedPart, "state");
					if (grading) {
						if (/<edu-input\b/i.test(modifiedPart)) {
							modifiedPart = this.upsertHtmlAttribute(modifiedPart, "state", grading);
						} else if (gradingClass) {
							modifiedPart = this.upsertHtmlClass(modifiedPart, gradingClass);
						}
					}

					if (value !== '') {
						const valueStr = escapeHtml(String(value));
						if (modifiedPart.includes('<edu-input')) {
							if (/value="[^"]*"/.test(modifiedPart)) {
								modifiedPart = modifiedPart.replace(/value="[^"]*"/, `value="${valueStr}"`);
							} else {
								modifiedPart = modifiedPart.replace('<edu-input', `<edu-input value="${valueStr}"`);
							}
						} else if (modifiedPart.includes('<input')) {
							if (/value="[^"]*"/.test(modifiedPart)) {
								modifiedPart = modifiedPart.replace(/value="[^"]*"/, `value="${valueStr}"`);
							} else {
								modifiedPart = modifiedPart.replace('<input', `<input value="${valueStr}"`);
							}
						}
					}

					return modifiedPart;
				}
				return part;
			} else {
				// Regular word
				return `<span class="word">${escapeHtml(part)}</span>`;
			}
		}).join(' ');
	}

	private renderClassification(data: TextEngineClassificationData): string {
		const parts = data.parts;
		const wordCategories = this._state.wordCategories ?? {};
		const gradingState = this._config.gradingState ?? {};
		const currentVariant = this.getAttribute("variant") ?? "outline";

		// Extract categories from targets
		const categories = data.targets.map(t => t.category);

		// Assign colors to categories (cycle through accent colors)
		const categoryColors: Record<string, string> = {};
		const colors = ['--edu-first-accent', '--edu-second-accent', '--edu-third-accent', '--edu-neutral'];
		categories.forEach((cat, i) => {
			categoryColors[cat] = colors[i % colors.length];
		});

		const wordsHtml = parts.map((word, index) => {
			const assignedCategory = wordCategories[index];
			const grading = gradingState[index];

			let classes = ['word', 'word-classifiable'];
			if (assignedCategory) classes.push('word-assigned');
			if (grading) classes.push(`word-${grading}`);

			// Use category color instead of label
			const categoryStyle = assignedCategory
				? `style="--category-color: var(${categoryColors[assignedCategory]})"`
				: '';

			return `
				<span class="${classes.join(' ')}" data-index="${index}" ${categoryStyle}>
					${escapeHtml(word)}
				</span>
			`;
		}).join(' ');

		const categoriesHtml = `
			<div class="categories" part="categories">
				${categories.map(cat => `
					<edu-block class="category-btn"
						${this._activeCategory === cat ? 'data-active="true"' : ''}
						data-category="${escapeHtml(cat)}"
						variant="${escapeHtml(currentVariant)}"
						style="--category-color: var(${categoryColors[cat]})">
						${escapeHtml(cat)}
					</edu-block>
				`).join('')}
			</div>
		`;

		return `
			<div class="classification-layout" part="classification-layout">
				<div class="words" part="words">${wordsHtml}</div>
				${categoriesHtml}
			</div>
		`;
	}

	private renderDND(data: TextEngineBaseData): string {
		// Render blanks (dropzones) and draggable chips
		const parts = data.parts;
		const placements = this._state.dndPlacements ?? {};
		const gradingState = this._config.gradingState ?? {};

		// Create dropzones for target positions
		const targetIndices = new Set<number>();
		for (const target of data.targets) {
			for (let i = target.startPos; i <= target.endPos; i++) {
				targetIndices.add(i);
			}
		}

		const contentHtml = parts.map((word, index) => {
			if (targetIndices.has(index)) {
				const placedWord = placements[index];
				const isPlaced = Boolean(placedWord);
				const grading = gradingState[index];

				let classes = ['dropzone'];
				if (isPlaced) classes.push('dropzone-filled');
				if (grading) classes.push(`dropzone-${grading}`);

				const content = isPlaced ? escapeHtml(placedWord) : '';

				return `<span class="${classes.join(' ')}" data-index="${index}">${content}</span>`;
			} else {
				return `<span class="word">${escapeHtml(word)}</span>`;
			}
		}).join(' ');

		// Create draggable chips
		const allWords = [...data.targets.flatMap(t => t.words)];
		if (data.distractors) {
			allWords.push(...data.distractors);
		}

		const placedWords = Object.values(placements);
		const availableWords = [...allWords];

		for (const placed of placedWords) {
			const idx = availableWords.findIndex((w) => normalizeWord(w) === normalizeWord(placed));
			if (idx !== -1) availableWords.splice(idx, 1);
		}

		const shuffledWords = shuffle(availableWords);
		const chipsHtml = shuffledWords.map(word => {
			return `<div class="chip" draggable="true" data-word="${escapeHtml(word)}">${escapeHtml(word)}</div>`;
		}).join('');

		return `
			<div class="dnd-container">
				<div class="dnd-text">${contentHtml}</div>
				<div class="dnd-chips">${chipsHtml}</div>
			</div>
		`;
	}

	private renderTransformation(data: TextEngineBaseData): string {
		const parts = data.parts;
		const transformations = this._state.transformations ?? {};
		const gradingState = this._config.gradingState ?? {};

		// Track which indices are targets
		const targetMap = new Map<number, number>(); // part index -> target index
		for (let i = 0; i < data.targets.length; i++) {
			const target = data.targets[i];
			for (let j = target.startPos; j <= target.endPos; j++) {
				targetMap.set(j, i);
			}
		}

		return parts.map((word, index) => {
			const targetIndex = targetMap.get(index);

			if (targetIndex !== undefined) {
				// This is an editable target
				const grading = gradingState[targetIndex];
				const transformed = transformations[targetIndex];
				const displayText = transformed ? transformed.join(' ') : data.targets[targetIndex].words.join(' ');

				let classes = ['word', 'word-editable'];
				if (grading) classes.push(`word-${grading}`);

				return `
					<span class="${classes.join(' ')}"
						  contenteditable="true"
						  data-target-index="${targetIndex}"
						  data-original="${escapeHtml(word)}">${escapeHtml(displayText)}</span>
				`;
			} else {
				return `<span class="word">${escapeHtml(word)}</span>`;
			}
		}).join(' ');
	}

	// ==================== EVENT HANDLERS ====================

	private onClick = (e: Event) => {
		const target = e.target as HTMLElement;

		// Handle highlight mode word selection
		if (target.classList.contains('word-selectable')) {
			const index = parseInt(target.getAttribute('data-index') ?? '');
			if (!isNaN(index)) {
				this.toggleWordSelection(index);
			}
		}

		// Handle classification mode category selection
		if (target.classList.contains('category-btn')) {
			const category = target.getAttribute('data-category');
			if (category) {
				this.setActiveCategory(category);
			}
		}

		// Handle classification mode word selection
		if (target.classList.contains('word-classifiable')) {
			const index = parseInt(target.getAttribute('data-index') ?? '');
			if (!isNaN(index) && this._activeCategory) {
				this.assignWordToCategory(index, this._activeCategory);
			}
		}

		// Allow clearing a placed dropzone with click.
		if (target.classList.contains('dropzone-filled')) {
			const index = parseInt(target.getAttribute('data-index') ?? '');
			if (!isNaN(index)) {
				this.clearDropzone(index);
			}
		}
	};

	private onChange = (e: Event) => {
		const target = e.target as HTMLElement;

		// Handle input elements from blanks mode
		if (target.tagName === 'EDU-INPUT' || target.tagName === 'INPUT') {
			const id = target.getAttribute('id');
			if (id) {
				const value = (target as any).value;
				this.updateInputValue(id, value);
			}
		}
	};

	private onInput = (e: Event) => {
		const target = e.target as HTMLElement;

		// Handle input elements from blanks mode in realtime
		if (target.tagName === 'EDU-INPUT' || target.tagName === 'INPUT') {
			const id = target.getAttribute('id');
			if (id) {
				const value = (target as any).value;
				this.updateInputValue(id, value);
			}
		}

		// Handle contenteditable transformation
		if (target.hasAttribute('contenteditable') && target.getAttribute('contenteditable') === 'true') {
			const targetIndex = parseInt(target.getAttribute('data-target-index') ?? '');
			if (!isNaN(targetIndex)) {
				const text = target.textContent ?? '';
				this.updateTransformation(targetIndex, text);
			}
		}
	};

	private onDragStart = (e: Event) => {
		const dragEvent = e as DragEvent;
		const target = dragEvent.target as HTMLElement;

		if (!dragEvent.dataTransfer) return;
		if (!target.classList.contains('chip')) return;

		const word = target.getAttribute('data-word') || target.textContent || '';
		if (!word) return;

		dragEvent.dataTransfer.setData('text/plain', word);
		dragEvent.dataTransfer.effectAllowed = 'move';
	};

	private onDragOver = (e: Event) => {
		const dragEvent = e as DragEvent;
		const target = dragEvent.target as HTMLElement;

		if (!target.classList.contains('dropzone')) return;
		dragEvent.preventDefault();
		dragEvent.dataTransfer!.dropEffect = 'move';
	};

	private onDrop = (e: Event) => {
		const dragEvent = e as DragEvent;
		const target = dragEvent.target as HTMLElement;

		if (!target.classList.contains('dropzone')) return;
		dragEvent.preventDefault();
		if (!dragEvent.dataTransfer) return;

		const index = parseInt(target.getAttribute('data-index') ?? '');
		if (isNaN(index)) return;

		const word = dragEvent.dataTransfer.getData('text/plain');
		if (!word) return;

		this.placeWordInDropzone(index, word);
	};

	// ==================== STATE MANAGEMENT ====================

	private _activeCategory: string | null = null;

	private toggleWordSelection(index: number) {
		if (!this._state.selectedIndices) {
			this._state.selectedIndices = new Set();
		}

		if (this._state.selectedIndices.has(index)) {
			this._state.selectedIndices.delete(index);
		} else {
			this._state.selectedIndices.add(index);
		}

		this.render();
		this.emitChange();
	}

	private setActiveCategory(category: string) {
		this._activeCategory = category;

		// Visual feedback: highlight active category button
		this.shadowRoot?.querySelectorAll('.category-btn').forEach((btn) => {
			if (btn.getAttribute('data-category') === category) {
				btn.classList.add('category-active');
				btn.setAttribute('data-active', 'true');
			} else {
				btn.classList.remove('category-active');
				btn.removeAttribute('data-active');
			}

			if (btn instanceof EduBlock) {
				btn.variant = (this.getAttribute("variant") ?? "outline") as Variant;
			}
		});
	}

	private assignWordToCategory(index: number, category: string) {
		if (!this._state.wordCategories) {
			this._state.wordCategories = {};
		}

		// Toggle: if word is already assigned to this category, unassign it
		if (this._state.wordCategories[index] === category) {
			delete this._state.wordCategories[index];
		} else {
			this._state.wordCategories[index] = category;
		}

		this.render();
		this.emitChange();
	}

	private updateInputValue(id: string, value: any) {
		if (!this._state.inputValues) {
			this._state.inputValues = {};
		}

		this._state.inputValues[id] = value;
		this.emitChange();
	}

	private updateTransformation(targetIndex: number, text: string) {
		if (!this._state.transformations) {
			this._state.transformations = {};
		}

		const words = text.split(/\s+/).filter(Boolean);
		this._state.transformations[targetIndex] = words;

		this.emitChange();
	}

	private placeWordInDropzone(index: number, word: string) {
		if (!this._state.dndPlacements) {
			this._state.dndPlacements = {};
		}

		this._state.dndPlacements[index] = word;
		this.render();
		this.emitChange();
	}

	private clearDropzone(index: number) {
		if (!this._state.dndPlacements) return;
		if (!(index in this._state.dndPlacements)) return;

		delete this._state.dndPlacements[index];
		this.render();
		this.emitChange();
	}

	private emitChange() {
		const detail: EduTextChangeDetail = {
			userState: this.getValue(),
			dataType: this._config.data.type
		};

		this.dispatchEvent(new CustomEvent<EduTextChangeDetail>('change', {
			detail,
			bubbles: true,
			composed: true
		}));
	}
}

function normalizeWord(value: string): string {
	return value.trim().toLowerCase();
}

if (!customElements.get('edu-text')) customElements.define('edu-text', EduText);
