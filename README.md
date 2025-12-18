# EduQuizz

An interactive educational quiz and exercise framework for creating engaging learning experiences.

## Overview

'Eduquizz' is a TypeScript-based library that provides quiz components and interactive educational exercises. The library offers a variety of quiz types including standards like multiple choice, matching, categorization, fill-in-the-blanks and much, much more. Each variety has its own set of variations, which each feels like its own unique thing. 

## Features

- **Multiple Quiz Types**: MCQ, matching, categorization, blanks, true/false, manual input, etc
- **Custom Web Components**: Letter picker, color picker, and global input components
- **Themeable**: Accepts CSS variables for dynamic theming 
- **Framework Agnostic**: Uses vanilla HTML/CSS + Typescript, works anywhere with simple wrappers 
- **TypeScript Support**: Full type definitions included
- **Audio Feedback**: Built-in sound effects for interactions

## Installation

```bash
npm install eduquizz 
```

## Quick Start

```typescript
import { MCQContract } from 'eduquizz';

// Use a quiz contract
const quizData = {
  question: "What is 2 + 2?",
  options: ["3", "4", "5"],
  correct: 1
};

// Asuming you have something like <div id="quiz-container"/>
const mountElement = document.getElementById('quiz-container');
const handle = MCQContract.implementation.renderer(mountElement, quizData);
```

## Variations Overview

Even when a variations seems unrelated, it usually means the grammar used to create this exercise
is the same, thus falling into the same category. The fact that two quizz types have the same grammar
also strongly suggests that the way they interact with the brain is pretty much similar, even though
it is displayed in completely different ways.

### Multiple Choice Questions (MCQ)
- Text question/instruction
- Settable number of correct answers 

### Matching Exercises
- **Matching Original**: Connect related items in two colunms
- **Matching Wheels**: Circular matching interface
- **Matching Single**: One-to-one matching
- **True/False**: Binary choice questions
- **Concepts Definition**: Match concepts to definitions

### Fill-in-the-Blanks
- **Blanks Single**: Indented for vocabulary practice or word guessing quizzes 
- **Blanks Multiple**: Have users fill text boxes with blanks formed from a variety of inputs 
- **Blanks Reading**: Text comprehension with blanks

### Categorization
- **Color Categorize**: Sort items with colors
- **Single Categorize**: Basic categorization exercise

### Manual Input
- Free-form text input exercises

## Custom Components

The library includes specialized web components:

- **Letter Picker**: ASCII letter selection component, solves unnecessary full-keyboard loading for simple inputs
- **Color Picker**: Simple color selection with limited palette, more optimal than built-in API
- **EduMCQ**: Enhanced multiple choice component

## Architecture

Each quiz type returns a contract structure:

```typescript
interface ContractType {
  name: string;
  description: string;
  version: number;
  implementation: {
    renderer: (mount: HTMLElement, data: any, options?: RendererOptions) => RendererHandle;
    validator: (data: any) => boolean;
    parser: (code: string) => any;
  };
  html: string;
  css: string;
}

// actual object is larger than shown here
```

And follows a specific structure:
```
- Imports
- Renderer
- - Root creation/Variables declaratioln
- - Component Specific functions
- - Initializer
- - Check Function
- - Return
- Parser
- Validator
- Contract
```

## If cloning from GITHUB: 

```bash
# Install dependencies
pnpm install

# Build library
pnpm build

# Development mode
pnpm dev

# Serve demo
pnpm serve
```

## Project Structure

```
src/
├── elements/          # Custom web components
├── quizzes/          # Quiz type implementations
│   ├── mcq/          # Multiple choice
│   ├── matching/     # Matching exercises
│   ├── blanks/       # Fill-in-the-blanks
│   ├── categorize/   # Categorization
│   └── manual/       # Manual input
├── services/         # Utility services
└── utils/           # Helper functions
```

## Requirements

- **FontAwesome 5 (cdn)**: Required for icons (add the script link from fontawesome.com)

## Browser Support

Modern browsers with ES2020 support. The library is bundled for browser environments and uses ES modules.

## License

MIT License. Please do attribute credits, would be really appreciated.
