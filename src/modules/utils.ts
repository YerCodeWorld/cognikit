interface ParserHelperResult = {
	ok: boolean;
	data: any;
	errors?: Record<string, string;
}

export function shuffle<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function extractDistractors(s: string): ParserHelperResult {
	const distractors: string[] = [];
	const cleanedCode: string = '';
	return { ok: true, data: { content: distractors, remain: cleanedCode }}
}

// Takes a block (usually parts of an exercise after splitting by ';') and 
// looks for a # or -> label, which indicate either instruction or hint. 
// Returns it alongside the cleaned string. 
export function takeOptionalLabel(block: string): { label: string; cleaned: string } {
	const firstLine = block.split(/\r?\n/, 1)[0]?.trim() ?? "";
	// formats supported: "-> Label" or "# Label"
	const arrow = /^->\s*(.+)$/;
	const hash = /^#\s*(.+)$/;

	if (arrow.test(firstLine)) {
		const label = firstLine.replace(arrow, "$1").trim();
		const cleaned = block.replace(/^[^\n]*\n?/, ""); // drop first line
		return { label, cleaned: cleaned.trim() };
	}

	if (hash.test(firstLine)) {
		const label = firstLine.replace(hash, "$1").trim();
		const cleaned = block.replace(/^[^\n]*\n?/, "");
		return { label, cleaned: cleaned.trim() };
	}

	return { label: "", cleaned: block.trim() };
}

export function splitBlocksOutsideParens(source: string): string[] {
	const out: string[] = [];
	let buf = "";
	let depth = 0;

	for (let i = 0; i < source.length; i++) {
		const ch = source[i];

		if (ch === "(") depth++;
		if (ch === ")") depth = Math.max(0, depth - 1);

		if (ch === ";" && depth === 0) {
		const piece = buf.trim();
		if (piece) out.push(piece);
			buf = "";
		} else {
			buf += ch;
		}
	}

	const tail = buf.trim();
	if (tail) out.push(tail);

	return out;
}

export function extractImage(block: string): { img?: string; cleaned: string } {
	// Matches: <data:...> or <http(s)://...>
	const m = block.match(/<\s*(data:[^>\s]+|https?:\/\/[^>\s]+)\s*>/i);
	if (!m) return { cleaned: block.trim() };

	const cleaned = block.replace(m[0], "").trim();
	return { img: m[1], cleaned };
}

export function splitPipes(s: string): string[] {
	return s.split("|").map(t => t.trim()).filter(Boolean);
}

export function dedupe<T>(arr: T[]): T[] {
	return [...new Set(arr)];
}


