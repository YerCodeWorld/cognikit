import CSS from "./styles.css";
import { TableConfiguration, TableState, CellValue, CellKind, TableCompletion, RowValues, EduTableChangeDetail } from "../../types/Tables"; 
import { shuffle, hash, escapeHtml } from "../../shared/utils";

type EduTableElement = HTMLElement & {
	config: TableConfiguration;

	getValue(): TableState;
	setValue(next: TableState): void;

	getState(): TableCompletion;

	reset(): void;
}

function escapeAttr(s: string) { return escapeHtml(s); }

export class EduTable extends HTMLElement implements EduTableElement {
	
	private _config: TableConfiguration;
	private _state: TableState = {};
	private _mounted = false;

	static get observedAttributes() { return ["variant"]; }

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
		this.shadowRoot?.addEventListener('change', this.onChange);
		this.shadowRoot?.addEventListener('input', this.onInput);
		this.render();
	}
	
	disconnectedCallback() {
		this._mounted = false;
	}

	set config(v: TableConfiguration) {
		this._config = v;
		this._state = this.initState(v);
		if (v.variant) this.setAttribute('variant', v.variant);
		this.render();
	}

	get config() {
		if (!this._config) throw new Error('<edu-table>: spec not set');
		return this._config;
	}

	get value() { return this._state; }
	set value(v: TableState) { this._state = v; this.render(); }

	getValue() { return this._state; }
	setValue(next: TableState) { this._state = next; this.render(); }
	
	getState(): TableCompletion {
		const config = this._config;
		if (!config) return {} as TableCompletion;

		const completion: TableCompletion = {};

		for (const r of config.rows) {
			const rowVals = this._state[r] ?? {}; 
			const selectedCols: string[] = [];

			for (const c of config.cols) {
				const v = rowVals[c] ?? null;
				
				if ((config.cellKind === 'checkbox' || config.cellKind === 'radio') && v === true) {
					selectedCols.push(c);
				}
			}

			completion[r] = {
				selectedCols,
				values: { ...rowVals }
			};
		}

		return completion;
	}

	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if (oldValue === newValue) return;

		if (name === 'variant') {
			this.setAttribute('variant', newValue);
		}
	}

	private initState(config: TableConfiguration): TableState {
		const state: TableState = {}

		for (const r of config.rows) {
			state[r] = {};
			for (const c of config.cols) {
				switch (config.cellKind) {
					case 'checkbox':
					case 'radio': 
						state[r][c] = false;
						break;
					case 'select':
					case 'text':
					case 'number':
						state[r][c] = null;
						break;
				}
			}
		}

		return state;
	}

	private render() {
		if (!this._mounted || !this.shadowRoot) return;

		if (!this._config) {
			this.$wrapEl.innerHTML = `<style>:host{display:block}</style><div></div>`;
			return;
		}

		const config = this._config;
		
		const cols = config.shuffle ? shuffle(config.cols) : config.cols; 
		const header = `
			<tr>
				<th></th>
				${cols.map(c => `<th scope="col">${escapeHtml(c)}</th>`).join('')}
			</tr>
		`;
		
		const rows = config.shuffle ? shuffle(config.rows) : config.rows;
		const body = rows.map(r => {
			const cells = cols.map(c => this.renderCell(config, r, c)).join('');
			return `<tr><th scope="row">${escapeHtml(r)}</th>${cells}</tr>`;
		}).join('');

		this.$wrapEl.innerHTML = `
			<style>${CSS}</style>
			<table part="table">
				<thead>${header}</thead>
				<tbody>${body}</tbody>
			</table>
		`;
	}

	private renderCell(config: TableConfiguration, r: string, c: string): string {
		const disabled = config.disabled?.(r, c) ?? false;
		if (disabled) return `<td aria-disabled="true" class="disabled-cell"></td>`;

		const id = `cell-${hash(r)}-${hash(c)}`;
		const value = this._state[r]?.[c] ?? null;

		const baseTd = (controlHtml: string) => `<td>${controlHtml}</td>`;

		const common = `id="${id}" data-r="${escapeAttr(r)}" data-c="${escapeAttr(c)}"
			aria-label="${escapeAttr(`${r} / ${c}`)}"`;

		switch (config.cellKind) {
			case 'checkbox': {
				const checked = value === true ? 'checked' : '';
				return baseTd(`<input ${common} type="checkbox" ${checked}/>`);
			}
			case 'radio': {
				const checked = value === true ? 'checked' : '';
				return baseTd(`<input ${common} type="radio" name="row-${hash(r)}" ${checked}/>`);
			}
			case 'text': {
				const v = value == null ? '' : String(value);
				return baseTd(`<input ${common} type="text" value="${escapeAttr(v)}"/>`);
			}
			case 'number': {
				const v = value == null ? '' : String(value);
				return baseTd(`<input ${common} type="number" value="${escapeAttr(v)}"/>`);
			}
			case 'select': {
				const opts = config.allowed?.(r, c) ?? [];
				const selected = value == null ? '' : String(value);

				const optionsHtml = [
					`<option value=""></option>`,
					...opts.map(v => {
						const s = String(v);
						const sel = s === selected ? 'selected' : '';
						return `<option value="${escapeAttr(s)}" ${sel}>${escapeHtml(s)}</option>`;
					})
				].join('');

				return baseTd(`<select ${common}>${optionsHtml}</select>`);
			}
		}
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

	private onChange = (e: Event) => {
		const t = e.target as HTMLElement;
		const r = t.getAttribute?.('data-r');
		const c = t.getAttribute?.('data-c');
		if (!r || !c || !this._config) return;

		const kind = this._config.cellKind;

		let value: CellValue = null;

		if (t instanceof HTMLInputElement) {
			if (kind === 'checkbox') value = t.checked;
			else if (kind === 'radio') value = t.checked;
			else if (kind === 'text') value = t.value;
			else if (kind === 'number') value = t.value === '' ? null : Number(t.value);
		}
		if (t instanceof HTMLSelectElement) {
			value = t.value === '' ? null : t.value;
		}

		this.applyCellValue(r, c, value);
		this.emitChange(r, c, value);
	};

	private onInput = (e: Event) => {}

	private applyCellValue(r: string, c: string, value: CellValue) {
		const config = this._config;
		if (!config) return;

		if (config.disabled?.(r, c)) return;
		
		if (config.cellKind === 'select') {
			const allowed = config.allowed?.(r, c);
			if (allowed && value !== null && !allowed.some(v => String(v) === String(value))) return;
		}

		this._state[r] ??= {};

		if (this._config.cellKind === 'radio' && value === true) {
			for (const col of this._config.cols) this._state[r][col] = false;
			this._state[r][c] = true;
			return;
		}

		this._state[r][c] = value;
	}

	private emitChange(row: string, col: string, value: CellValue) {
		const detail: EduTableChangeDetail = {
			row, 
			col,
			value,
			state: this.getValue(),
			selection: this.getState()
		};

		this.dispatchEvent(new CustomEvent<EduTableChangeDetail>('change', {
			detail,
			bubbles: true,
			composed: true
		}));
	}
}

if (!customElements.get('edu-table')) customElements.define('edu-table', EduTable);
