/**
 * INPUT ENGINE - Render different input elements (text/number/select) + utilities like image URLs
 *
 * This is probably not a "new" idea, but I thought of it without seeing anything similar elsewhere.
 * After looking for some things I found what could be the closest example:
 * @see https://www.english-grammar.at/online_exercises/open-cloze/open-cloze-index.htm
 */

import CSS from "./styles.css";
// import { splitPipes, dedupe, shuffle } from "../../shared/utils";

// still wondering why... for the hundredth time 
type ParseError = { pos: number; msg: string };
type ParseResult = {
	ok: boolean;
	content?: { html: string; answerKey: Map<string, any> };
	errors: ParseError[];
};

export function InputEngineParser(dsl: string) {
	
	
	
	
}
