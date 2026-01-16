# AGENTS

Quick orientation for Codex agents working in this repo.

## Project summary
- TypeScript web-components framework for educational/psychometric interactions.
- Source lives in `src/`. Build outputs go to `dist/` and demo bundle `public/app.js`.
- The demo HTML files in `public/` are static and import the bundle.

## Structure map
- `src/core/` base abstractions (notably `BaseInteraction.ts`).
- `src/modules/` interaction modules by cognitive process.
- `src/shell/` the `edu-window` shell component that hosts interactions.
- `src/engines/` standalone engines (tables, html DSL, etc).
- `src/ui/` shared UI primitives (inputs, misc components).
- `src/shared/` shared types, parsers, utilities.
- `public/` demo site; `public/examples/` contains standalone pages.

## Commands
- `pnpm dev` build the demo bundle to `public/app.js` (watch mode).
- `pnpm build` clean + build library + types + demo bundle.
- `pnpm serve` currently runs `serve public -l 3008 -s` (SPA fallback).
  Use `serve public -l 3008` if you need direct access to `/chip.html` and other files.

## Conventions and notes
- Do not edit `dist/` or `public/app.js` by hand; they are generated.
- No test harness is defined in `package.json`.
- The repo is `type: module`, so ESM syntax is expected.
