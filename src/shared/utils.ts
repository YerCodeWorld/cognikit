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

export function extractDistractors(s: string): { ok: boolean; data?: any; errors?: Record<string, string> } {
	const distractors: string[] = [];
	const cleanedcode: string = '';
	return { ok: true, data: { content: distractors, remain: cleanedcode }}
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

