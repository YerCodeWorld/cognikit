
CHIP


- Update chip.ts to support all remaining types of stimulus
- Allow chip to render image+text if both are available

SOUND

- Create TTS helper using the built-in API

-------

ENGINES

- Create the markable-words engine
- Create the 'cloze' engine
- Define generalized DSL patterns

--------

- Check out how to implement presentation modes

--------

INTERACTIONS

1) Feedback

- Implement 'immediate feedback mode' for all available interactions

2) Data

- Implement 'IInteractionSpec' interfaces for all suitable interactions, which sets a configuration object for that particular interaction

## OddOnesOut

Module: Discrimitation

Very similar with @openClassification.ts | I was thinking I could create a wrap for it or simply
tweakign openClassification a bit so that it accepts both modes.

// ================= PLANNING ================

## Mark the words
## Mark the words: Classification Mode

----------

interactive text engine

Take: { text: string; targets: string[] | Map<string, string[]>}

Provides:
    - Grader: compare the user's selections againts the targets list

Features:
    - provides variants, 8 different stylings just as the other components
    - each word is selectable
    - on hover, each word has an effect
    - multi-select mode: more than one color to select words with (suggesting multiple categories)
    - grouping: selecting a group of consecutive words that are supposed to be together
    - drag-select, to avoid tediusness 

Return:
    - el with populated spans
    - getSelections() method
    - gradeInstace() method: compare the selections against the provided targets list

The engine can then be used to create both mark the words interactions, or even more:

## Mark the words: sequential (intended for short sentences to target a few words)

-----------

## Cloze: sequential
## Close: static

-----------

DSL: Shared utilities

Functions to render things like the following:

@tx(option1 | option2 | option3): not a select, rather a 'input type="text"' with expected value to be any of the options 
@nm(1 | 4..8 | 34..87): a "input type='number'" with expected values to be between any of the options OR the ranges (i.g between 24 and 87)
@sl([correctOption | correctOption2] | option1 | option2): simple { correctionOptions: string[], options: string[]; }, which is a select+options element

Function for stimulus content

@:assetRef

The 'assetRef' is expected to be the ID of a field in a virtual 'assets' object, that can point to different things from video, audio, image or htmt

-----------

Fill the blanks engine

Using the DSL shared utilities, read something like:

`
The day yesterday was @(sunny|cloudy), but that didn't stop roughly @nm(6..11) kids to go outside and play.
I asked Maria how she @sl([felt] | cook | wrote) about that, and she told me it felt nice.
`

And:
    - render a element with the text, replacing the function calls with the actual [empty] elements
    - provide a answer key Map<element, validOptions> where element is a ID string, and valid options is a string[]
    - provide a helper function that takes each element, gets their value, compares with the answer key, and changes their 'states' (correct / wrong / missed)

It can be overpowered by also supporting a separate 'assets' object, just like the interactions do already.

Can be used to create the Cloze interactions mentioned above
----------


/**
export type DslFunction = 'tx' | 'nm' | 'dt' | 'sl';

export type DslDetectionData = {
	remainder: string;
	function: DslFunction;
};

export const dslFunctionRe = /@([a-zA-Z]{2})\(([^)]*)\)/g;

export const splitPipes = (s: string) => s.split("|").map(t => t.trim()).filter(Boolean);
const dedupe = <T,>(arr: T[]) => [...new Set(arr)];

export function detectDslUsage(s: string): DslDetectionData | string {
	const match = dslFunctionRe.exec(s);
	if (match) return { remainder: match[2], function: (match[1] as DslFunction)}
	return s;
}

// export function parseCl()

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

**/
