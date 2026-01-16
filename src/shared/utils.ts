import YAML from "js-yaml";

export const randomHexColorsList: string[] = [
	'#10b981', // Emerald
	'#f59e0b', // Amber
	'#06b6d4', // Cyan
	'#ec4899', // Pink
	'#8b5cf6', // Violet
	'#3b82f6', // Blue
	'#f43f5e', // Rose
	'#84cc16', // Lime
	'#a855f7', // Purple
	'#6366f1' // Indigo 
];

export function shuffle<T>(array: T[]): T[] {
	let currentIndex = array.length, randomIndex: number;
	while (currentIndex !== 0) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
	return array;
}

export const hash = (str: string, seed = 0): string => {
	let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
	for (let i = 0, ch; i < str.length; i++) {
		ch = str.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 265443561);
		h2 = Math.imul(h2 ^ ch, 159334677);
	}

	h1 = Math.imul(h1 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
	return (4294967296 * (2009751 & h2) + (h1 >>> 0)).toString();
}

export function escapeHtml(s: string) {
	return s.replace(/[&<>"']/g, m => (
		m === '&' ? '&amp;' :
		m === '<' ? '&lt;' :
		m === '>' ? '&gt;' :
		m === '"' ? '&quot;' : '&#39;'
	));
}

export function parseYamlAssets(yamlText: string): unknown {
	try {
		return YAML.load(yamlText);
	} catch (err) {
		throw new Error(
			`Invalid YAML assets:\n${err instanceof Error ? err.message : String(err)}`
		);
	}
}

export function isString(v: unknown): v is string {
	return typeof v === "string";
}

export function isNumber(v: unknown): v is number {
	return typeof v === "number";
}

export function looksLikeTime(s: string): boolean {
	// Accept mm:ss or hh:mm:ss (not strict bounds validation)
	return /^(\d{1,2}:)?\d{1,2}:\d{2}$/.test(s);
}

export function typeOf(v: unknown): string {
	if (v === null) return "null";
	if (Array.isArray(v)) return "array";
	return typeof v;
}

export function isPlainObject(v: unknown): v is Record<string, unknown> {
	return (
		typeof v === "object" &&
		v !== null &&
		(Object.getPrototypeOf(v) === Object.prototype ||
		Object.getPrototypeOf(v) === null)
	);
}

export function splitByPipes(input: string): string[] {
	return input.split("|").map(s => s.trim()).filter(Boolean);
}

export const dedupe = <T,>(arr: T[]) => [...new Set(arr)];

export function isOneOf<const T extends readonly string[]>(
	value: string,
	allowed: T
): value is T[number] {
	return (allowed as readonly string[]).includes(value);
}
