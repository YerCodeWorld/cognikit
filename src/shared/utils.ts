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


