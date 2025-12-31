export type ParseError = { pos: number; msg: string };

export type ParseResult = {
	ok: boolean;
	content?: { html: string; answerMap: Map<string, any> };
	errors: ParseError[];
};

export function createDSLParser() {

	type Ctx = { elsCounter: number; answerMap: Map<string, any> };

	const splitPipes = (s: string) =>
		s.split("|").map(t => t.trim()).filter(Boolean);

	const dedupe = <T,>(arr: T[]) => [...new Set(arr)];

	function shuffle<T>(array: T[]): T[] {
		let currentIndex = array.length, randomIndex: number;
		while (currentIndex !== 0) {
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;
			[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
		}
		return array;
	}

	const buildGrammar = (ctx: Ctx) => {
		function parseTX(content: string, pos: number, blocksCounter?: number): string {

			const tokens = splitPipes(content);
			if (tokens.length === 0 || tokens.some(t => !t)) {
				throw new Error(`@tx: provide at least one non-empty answer. Pos ${pos}.`);
			}

			const answers = dedupe(tokens);
			const id = "el_" + Math.random().toString(36).slice(2);
			ctx.answerMap.set(id, answers);
			return `<input type="text" id="${id}" autocomplete="off">`;
		}

		function parseNM(content: string, pos: number, blocksCounter?: number): string {
			const tokens = splitPipes(content);
			if (tokens.length === 0) throw new Error(`@nm: empty content. Pos ${pos}.`);

			const values: number[] = [];
			const ranges: Array<{ min: number; max: number }> = [];

			for (const t of tokens) {
				const m = t.match(/^\s*(-?\d+)\s*(\.\.)\s*(-?\d+)\s*$/);
				if (m) {
					const min = parseInt(m[1], 10);
					const max = parseInt(m[3], 10);
					if (Number.isNaN(min) || Number.isNaN(max)) {
						throw new Error(`@nm: invalid range '${t}'. Pos ${pos}.`);
					}
					if (min > max) throw new Error(`@nm: range min > max in '${t}'. Pos ${pos}.`);
					ranges.push({ min, max });
				} else {
					const n = Number(t.trim());
					if (!Number.isInteger(n)) throw new Error(`@nm: '${t}' is not an integer. Pos ${pos}.`);
					values.push(n);
				}
			}

			const id = "el_" + Math.random().toString(36).slice(2);
			ctx.answerMap.set(id, { single: dedupe(values), ranges });
			return `<input type="number" id="${id}">`;
		}

		function parseSL(content: string, pos: number): string {
			const bracketMatches = [...content.matchAll(/\[([^\]]+)\]/g)];
			const correct = bracketMatches.flatMap(m => splitPipes(m[1]));
			const cleaned = content.replace(/\[|\]/g, "");
			const options = [" ", ...shuffle(dedupe(splitPipes(cleaned)))];

			if (options.length === 0) throw new Error(`@sl: provide at least one option. Pos ${pos}.`);
			if (correct.length === 0) throw new Error(`@sl: mark correct option(s) in [brackets]. Pos ${pos}.`);

			for (const c of correct) {
				if (!options.includes(c)) throw new Error(`@sl: correct '${c}' not present among options. Pos ${pos}.`);
			}

			const id = "el_" + Math.random().toString(36).slice(2);
			ctx.answerMap.set(id, { correct, options: options.filter(o => !correct.includes(o)) });
			const optsHTML = options.map(o => `<option>${o}</option>`).join("");
			return `<select id="${id}">${optsHTML}</select>`;
		}

		function parseIMG(content: string, pos: number, blocksCounter?: number): string {
			const [rawUrl, rawAlt] = splitPipes(content);
			const url = (rawUrl ?? "").trim().replace(/^["']|["']$/g, "");
			const altRaw = (rawAlt ?? "image").trim();
			if (!url) throw new Error(`@img: missing URL. Pos ${pos}.`);
			const ok = /^(https?:\/\/|data:image\/[a-zA-Z]+;base64,)/.test(url);
			if (!ok) throw new Error(`@img: invalid or unsupported URL '${url}'. Pos ${pos}.`);
			const alt = altRaw.replace(/"/g, "&quot;");
			return `<img src="${url}" alt="${alt}">`;
		}

		return {
			tx: parseTX,
			nm: parseNM,
			sl: parseSL,
			img: parseIMG,
		} as const;
	};

	// public parse
	function parse(code: string): ParseResult {

		const ctx: Ctx = { elsCounter: 0, answerMap: new Map<string, any>() };
		const grammar = buildGrammar(ctx);

		const errors: ParseError[] = [];
		let i = 0;
		let textBuf = "";

		while (i < code.length) {
			const ch = code[i];

			if (ch === "@" && code[i + 1] === "@") { textBuf += "@"; i += 2; continue; }
			if (ch !== "@") { textBuf += ch; i++; continue; }

			const currentPos = i;
			i++; // skip '@'

			let fn = "";
			while (i < code.length && /[a-z]/i.test(code[i])) fn += code[i++];
			if (!fn) {
				errors.push({ pos: currentPos, msg: "Expected a function id after '@' (e.g., @tx, @nm, @sl)." });
				textBuf += "@";
				continue;
			}
			if (code[i] !== "(") {
				errors.push({ pos: currentPos, msg: `Expected '(' after @${fn.substring(0, 2)}.` });
				textBuf += `@${fn}`;
				continue;
			}
			i++; // skip '('

			// read until ')'
			let content = "";
			let closed = false;
			while (i < code.length) {
				if (code[i] === ")") { closed = true; i++; break; }
				content += code[i++];
			}
			if (!closed) {
				errors.push({ pos: currentPos, msg: `Unclosed parentheses for @${fn}(...).` });
				textBuf += `@${fn}({$content})`;
				continue;
			}

			const parser = (grammar as any)[fn];
			if (!parser) {
				errors.push({ pos: currentPos, msg: `Unknown input type '@${fn}'. Allowed: ${Object.keys(grammar).join(", ")}.` });
				textBuf += `@${fn}(${content})`;
				continue;
			}

			try {
				ctx.elsCounter++;
				textBuf += parser(content.trim(), currentPos);
			} catch (e: any) {
				errors.push({ pos: currentPos, msg: String(e?.message ?? e) });
				textBuf += `@${fn}(${content})`;
			}
		}

		if (errors.length > 0) return { ok: false, errors };

		return {
			ok: true,
			content: { html: textBuf.replace(/\n/g, "<br>"), answerMap: ctx.answerMap },
			errors,
		};
	}

	const validateData = (_data: any) => true;

	function checkAnswers(
		answerMap: Map<string, any>,
		parent: Document | HTMLElement = document
	) {
		const details: Record<string, any> = {};
		let total = 0, correct = 0;
		const getEl = (id: string) => parent.querySelector<HTMLElement>(`#${id}`);

		answerMap.forEach((spec, id) => {
			total++;
			const el = getEl(id);
			if (!el) { details[id] = { ok: false, error: "Element not found" }; return; }
			let ok = false, got: any;

			if (Array.isArray(spec)) {
				const v = (el as HTMLInputElement).value.trim();
				got = v;
				ok = spec.some(a => a.toLowerCase() === v.toLowerCase());
				details[id] = { type: "tx", ok, expectedAnyOf: spec, got };
			} else if ("single" in spec && "ranges" in spec) {
				const v = Number((el as HTMLInputElement).value);
				got = v;
				const isInt = Number.isInteger(v);
				const inSingles = isInt && spec.single.includes(v);
				const inRanges = isInt && spec.ranges.some((r: any) => v >= r.min && v <= r.max);

				ok = inSingles || inRanges;
				details[id] = { type: "nm", ok, expected: spec, got };
			} else if ("correct" in spec) {
				const v = (el as HTMLSelectElement).value;
				got = v;
				ok = spec.correct.includes(v);

				details[id] = { type: "sl", ok, expectedAnyOf: spec.correct, got };
			} else {
				details[id] = { ok: false, error: "Unknown spec shape" };
			}

			el.style.borderBottom = ok
			? "2px solid color-mix(in oklab, rgb(var(--edu-success)) 45%, transparent)"
			: "2px solid color-mix(in oklab, rgb(var(--edu-error)) 45%, transparent)";

			if (ok) correct++;
		});

		return { total, correct, details };
	}

	// optional test (isolated)
	function test() {

		const code = `
@img(https://picsum.photos/seed/market/640/360 | A bustling city market)

Saturday Morning at the Market

On a @tx(sunny | rainy) morning, Lina and Joel arrived at the old city market around @nm(7..9) AM.
They planned to buy @nm(2..4) kinds of produce and a small gift for their friend’s birthday.

First, they stopped at a booth selling @sl([fresh fruits] | electronics | winter coats | phone cases).
Lina pointed at oranges and asked, “Are these @tx(sweet | sour | fresh) today?”
The vendor smiled and said, “Try one!”

After tasting, Joel decided to get @nm(3 | 5 | 7) oranges and @nm(1..2) pineapple(s).
They also compared two jars of jam:
- Label A: “Harvest Blend — @tx(homemade | organic | imported)”
- Label B: “City Classic — @tx(homemade | organic | imported)”

@img(https://picsum.photos/seed/jam-stand/640/360 | Jam stand with glass jars)

Next, they browsed the craft aisle to pick a present.
They considered a bracelet, a notebook, and a mug. The notebook caught their eye because its cover read:
“@@Make it happen.” 

At checkout, the clerk asked: “Paper or @sl([reusable bag] | plastic bag | no bag)?”
They paid exactly @nm(10 | 12 | 15..18) dollars (including a small discount) and left before @nm(10..11) o’clock.

Back home, Joel typed a quick review:
“The market was @tx(clean | lively | crowded), prices were @tx(fair | high), and the vendors were @tx(kind | helpful).”
They promised to return next @sl(Monday | [Saturday] | Thursday) to try new fruits and jam flavors.     
		`;

		return parse(code);
	}

	console.log(test());

	return {
		parse,              // dslParser
		checkAnswers,       // checkAnswers
		validateData,       // validator
		test                // testSystem
	};
}
//
// ---------- usage ----------
/*
import { createDSLParser } from "./dsl-parser";

const dsl = createDSLParser();
const result = dsl.parse(codeString);
if (result.ok) {
const { html, answerMap } = result.content!;
// render html ...
const score = dsl.checkAnswers(answerMap, document);
}
*/

createDSLParser();
