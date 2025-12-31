# COGNIKIT

A TypesScript framework for creating cognitively-grounded assesseent systems, quizzes and interactive educationally-oriented exercises. 
It is built on research in assessment design, psycometrics and cognitive science, while no stopping from getting ideas from casual 
environments like classrooms (the author, *me*, is a teacher), and being flexible enough to be used in other contexts like games, articles, and more.

---

## Overview

'Cognikit' provides a structured approach to building educational assessments while aligning them with specific cognitive processes, a curated list
of the later which are suitable for simple implementations anywhere and do not require "heavy machinery" like graphics, audio or usage of APIs. 

While what was previously mentioned might seem like a 'limitation', it is so to keep things minimal and does not mean it cannot be easily extended
into something bigger, since that's exactly what can be done with greater tooling and infraestructure. 

Key end-use features:

- **Small grammars ("DSLs") parsers for each module**
- **'Validators' to enforce constraints over the data the parsers generate**
- **Built-in mini component library**
- **Engines for unique tools**
- **Styling variations supporting components**
- **Grading utilities**

Key development features:

- **Zero dependencies**
- **Uses vanilla web technologies (and typescript)**
- **Strongly typed system**
- **Modular Arquitecture**
- **Mixes up OOP and FP**

---

Take a look at the file structure to also visualize some of the features mentioned:

```txt
src/
	// base *abstract* class which is used for all other interactions.
	// It itself depends on the *shell* custom component at @shell
	core/
		BaseInteraction.ts
	
	// modules which on themselves provide the *interactions*, more detailed later
	modules/
		classification/
		discrimination/
		recognition/
		seriation/
		comparison/
		...

	engines/
		tables/
		html/
		...
	
	// Custom base component that implements solutions and provides an API for tracking and showing
	// progress, radio navigation, check button, prompt visualization and timer.
	shell/
		window.ts

	ui/
		input/
		misc/

	shared/
		...

	types/
		Tables.ts
		Grading.ts
```

Each 'module' follow a designed pattern:

```
modules/<process>/
	module.ts			// Central object that exports all features of the module
	implementation.ts  		// parser, validator and grader
	interactions/
		<interaction>.ts	// Classes that extend the *BaseInteraction* abstract class to create a unique way to complete an item
	doc/
		interactions.ts  	// Use the "IInteraction" interface and works as a programmatic documentation object
		<process>.md		// Research and justification of the 'conginitive process' 
```

---

### Architecture Overview

[https://sage-babka-680d4e.netlify.app]

### Common Patterns

Both the *engines* and each module support a specific 'grammar', some sort of simple text-based quizz construction; those are based on the idea
that creating quizzes should be simple and not require heavy forms and explanations. Just a simple -textentry-, pasting the 'code' that would be it.

Check this example workflow:

```ts
// *CLASSIFICATION* module 'DSL'
const data = `
AMERICA = DR 	     | USA | Mexico;
ASIA    = Thailand   | PNG | India | Mongolia;
Africa  = Madagascar | Kenya;
= Antartica | Greenland;
`;

const parsedData = classificationParser(data);
const isValid = classificationValidator(parsedData);

if (isValid) {
	console.log(parsedData);
}

/** Which would be equal to something like this:
 * [
 * 	{ label: 'AMERICA', items: [ 'DR', 'USA', 'Mexico ] },
 *	{ label: 'ASIA', items: [ 'Thailand', 'PNG', 'India', 'Mongolia' ] },
 *  	{ label: 'Africa', items: [ 'Madagascar' | 'Kenya' ] }
 * ],
 * [ 'Antartica', 'Greenland' ] -> These are distractors
 */ 
```

The final data after parsing and validating results in an object that is easily consummable for those interactions to display their specific way to 
complete the quizz, state management and way to communicate with the base BaseInteraction abstract class.

Example data objects
```ts
interface ClassificationData {
	type: 'classification'; 
	categories: { label: string; items: string[] }[];
	distractors?: string[];
}

interface AssociationData {
	type: 'association';
	pairs: { left: string; right: string }[];
	distractors?: string[];
}

interface FreeRecallData {
	type: 'freerecall';
	instructions: { prompt: string; words: string[] }[];
}
```

## NOTES

1) Each module has a unique text-based way of representing their required data
2) Each data model is defined in the central types (@src/shared/types.ts)
3) While it's heavily focused on this method, the way to construct the data can be done in any other way, interactions are unrelated to those processes
4) ** The 'engines' use this pattern too, but the way to use them is different since they are stand-alone.**

```ts
// example "interaction" that uses the *TABLES* engine
export class ClassificationMatrix extends BaseInteraction<BaseTableData> {

    private _tableConfig: TableConfiguration;
    private _$table!: EduTable;

    constructor(options: InteractionOptions<BaseTableData>) {
        super(options);

        this._tableConfig = {
            rows: this.data.rows,
            cols: this.data.cols,
            answerKey: this.data.answerKey,
            cellKind: 'checkbox',
            preset: 'classification',
            variant: this.data.variant ?? 'outline'
        };

        this.initializeProgress(this.data.rows.length);
    }

    render(): void {
        const content = this.getContentArea();

        this._$table = document.createElement('edu-table') as EduTable;
        this._$table.config = this._tableConfig;

        content.innerHTML = '';
        content.append(this._$table);
    }

    getCurrentState(): any {
        return this._$table.getState();
    }

    isInteractionComplete(): boolean {
        return false;
    }
}
```

---

## Variant System

All custom components support a `variant` attribute for consistent theming:

```ts
type Variant =
    | 'elegant'   
    | 'playful'  
    | 'outline' 
    | 'letter' 
    | 'sign'   
    | 'minimal'
    | 'glass' 
    | 'empty';
```

Variants are applied via CSS host selectors:

```css
:host([variant="elegant"]) {
    /* Elegant styling */
}

:host([variant="playful"]) {
    /* Playful styling */
}
```

---

### SPECIFICS

Most subdirectories that introduce some sort of system or important file provide a README.md that is to be read to get more insight on what it does and
how it works. This overview here provides a great general idea of how everything pretty much works, but reading specifics is also necessary.

---

## Development

### Setup

```bash
pnpm install
```

### Scripts

```bash
pnpm dev           # Watch mode with hot reload
pnpm build         # Build library + types + demo
pnpm build:lib     # Build library only
pnpm build:demo    # Build demo app
pnpm types
pnpm serve
pnpm clean
```

### Build Configuration

- **Bundler**: esbuild
- **Module Format**: ESM
- **Platform**: Browser
- **Loaders**:
  - `.html` files as text
  - `.css` files as text

---

## Usage

### Creating a Module

1. Create directory: `src/modules/<process>/`
2. Implement parser, validator, grader in `implementation.ts`
3. Create interaction classes in `interactions/`
4. Define module metadata in `module.ts`
5. Document in `doc/`

### Creating an Interaction

```typescript
import { BaseInteraction } from '../../core';
import { InteractionOptions } from '../../shared';

export class MyInteraction extends BaseInteraction<MyDataType> {

    constructor(options: InteractionOptions<MyDataType>) {
        super(options);
        this.initializeProgress(/* total steps */);
    }

    render(): void {
        const content = this.getContentArea();
        // Render interaction UI
    }

    getCurrentState(): any {
        // Return current user state
    }

    isInteractionComplete(): boolean {
        // Check completion status
    }

    protected submitForScoring(): void {
        const state = this.getCurrentState();
        // Grade and handle result
    }
}
```

## Contributing

This is a research project in active development. Feedback and contributions welcome at the GitHub repository.
