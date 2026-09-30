---
title: Requirements
description: What the requirements folder holds, how it ranks against ADRs and the conventions in CONTRIBUTING/AGENTS, and the fixed project constraints; read before writing, citing or challenging a requirement.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-09-30
tags: [requirements, index]
related:
  ['docs/README.md', 'docs/requirements/06-mvp-requirements.md', 'docs/decisions/0000-template.md']
---

# Requirements

Purpose: Read this when you need to know what Eternalus must do and how it must be built, where
that is written down, and which document wins when two disagree. This folder is the
**principles and requirements layer**: it explains _what_ is required and _why_, at the level a
senior engineer would demand. The mechanical rules that implement the requirements (naming, file
layout, TypeScript settings, git basics, Definition of Done) stay in
[`CONTRIBUTING.md`](../../CONTRIBUTING.md) and the compact agent contract in
[`AGENTS.md`](../../AGENTS.md); the documents here link to them rather than repeating them.

## What this folder is

Every document here states requirements with stable IDs that plan docs, ADRs, PRs and tests cite:

| Prefix    | Meaning                                    | Document                                                         |
| --------- | ------------------------------------------ | ---------------------------------------------------------------- |
| `AP-nn`   | Architecture principle                     | [`01-architecture-principles.md`](01-architecture-principles.md) |
| `CP-nn`   | Coding principle                           | [`02-coding-principles.md`](02-coding-principles.md)             |
| `OG-nn`   | Organization guideline                     | [`03-organization-guidelines.md`](03-organization-guidelines.md) |
| `AI-nn`   | Agentic (AI-agent work) instruction        | [`04-agentic-instructions.md`](04-agentic-instructions.md)       |
| `ES-nn`   | Engineering standard                       | [`05-engineering-standards.md`](05-engineering-standards.md)     |
| `FR-nnn`  | Functional requirement (MVP catalogue)     | [`06-mvp-requirements.md`](06-mvp-requirements.md)               |
| `NFR-nnn` | Non-functional requirement (MVP catalogue) | [`06-mvp-requirements.md`](06-mvp-requirements.md)               |

IDs are never reused or renumbered. A withdrawn requirement keeps its ID with the status
**removed** and a pointer to the ADR that removed it.

## Precedence

When two documents disagree, the higher one wins and the lower one is a bug to fix:

1. **Product owner decisions recorded as ADRs** in [`../decisions/`](../decisions/). Decisions
   D1–D12 from Phase 0 are already recorded there (TypeScript everywhere, React + Redux Toolkit +
   Vite for menus and HUD, IndexedDB behind one `PersistenceController`, the entity model, phase
   branching, the docs tree, config-generated maps, single-threaded simulation, 30 ticks/s, team
   as a component, data-driven specialisations, and the post-MVP list).
2. **This folder** (`docs/requirements/`), including the source transcription in
   [`source/`](source/requirements-of-architecture.md). The catalogue in `06` is normalised from
   the source; if they differ, the catalogue is wrong unless an ADR explains the difference.
3. **Conventions**: [`CONTRIBUTING.md`](../../CONTRIBUTING.md), [`AGENTS.md`](../../AGENTS.md)
   and the package `AGENTS.md` files. These say _how_; they may not contradict _what_.
4. **Code comments and TSDoc.** They explain local intent and must agree with everything above.

Architecture docs in [`../architecture/`](../architecture/) _realise_ the requirements; plan docs
in [`../plan/`](../plan/) _schedule_ them. Neither may silently add or drop a requirement: that
is an ADR plus a catalogue edit.

## Constraints (fixed for the MVP)

| Constraint              | Value                                                                                                                                                                                                                                                           | Source                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Languages               | JavaScript/TypeScript, HTML, CSS only. Decided: full strict TypeScript everywhere (D1).                                                                                                                                                                         | `Req: MVP`; ADR 0003                                                                      |
| Engines and frameworks  | No game engine and no game framework for the MVP; a custom Canvas 2D engine. React + Redux Toolkit + Vite are kept for menus and HUD (D2) **pending instructor confirmation**; if the instructor rejects them, only `apps/client/src/ui/` and `bridge/` change. | `Req: preamble`; ADR 0004                                                                 |
| Runtime                 | Browser-only, single player against bots, no server, no accounts. Persistence is local (IndexedDB, D3).                                                                                                                                                         | ADR 0005; `README.md`                                                                     |
| Toolchain               | Node 24.21.0 (`.nvmrc`, `engine-strict`), npm 11 with `save-exact`; `npm run check` is the gate on Linux, macOS and Windows.                                                                                                                                    | `package.json`, `.npmrc`, [`../process/guardrails.md`](../process/guardrails.md)          |
| Team                    | Five students. Product owner and lead architect: Sam Holtzman (`sholtzman`). Repository owner and maintainer of `main`: SamarjitBhogal. Everyone else contributes through PRs into phase branches (D5).                                                         | Writer brief; ADR 0007                                                                    |
| Course                  | COMP 7082 Software Engineering, BCIT, Fall 2026. Best practice and organisation are graded, not just the game.                                                                                                                                                  | `Req: The goal of telling you the MVP vs the full game`                                   |
| Term timeline           | **Unknown at the time of writing.** Sprint lengths and cut lines in [`../plan/README.md`](../plan/README.md) are provisional until the course schedule is confirmed; flagged as an open item there.                                                             | Writer brief                                                                              |
| Scale targets           | Max 10 Legends per team; max 144 units per team for the MVP, engineered for hundreds.                                                                                                                                                                           | `Req: developer menu`                                                                     |
| AI-assisted development | Heavy use of coding agents (Claude Code, ChatGPT/Codex, Gemini) through one harness; `AGENTS.md` is canonical.                                                                                                                                                  | `Req: heavy use of AI agents`; [`04-agentic-instructions.md`](04-agentic-instructions.md) |

## Files in this folder

| File                                                                               | Read it when                                                                            |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [`01-architecture-principles.md`](01-architecture-principles.md)                   | You design a subsystem or review a design for architectural fit                         |
| [`02-coding-principles.md`](02-coding-principles.md)                               | You write or review code and want the reasoning behind the conventions                  |
| [`03-organization-guidelines.md`](03-organization-guidelines.md)                   | You wonder where a new file, doc or decision goes, or which docs a change must touch    |
| [`04-agentic-instructions.md`](04-agentic-instructions.md)                         | You brief, run or review an AI coding agent, or you are one                             |
| [`05-engineering-standards.md`](05-engineering-standards.md)                       | You plan tests, performance work, security, persistence, caching or accessibility       |
| [`06-mvp-requirements.md`](06-mvp-requirements.md)                                 | You need the definitive list of what the MVP must do, its acceptance criteria and phase |
| [`source/requirements-of-architecture.md`](source/requirements-of-architecture.md) | You need the product owner's original wording                                           |

## How to cite and change a requirement

- Cite by ID (`FR-025`, `AP-05`) in task briefs, PR descriptions, test names and ADRs.
- To add or change a requirement: open an ADR (copy
  [`../decisions/0000-template.md`](../decisions/0000-template.md)), get the product owner's
  acceptance, then edit the catalogue in the same PR and bump its `last-reviewed`.
- Agents never change requirements on their own; they cite the requirement they are implementing
  and stop when a task would need a new one (see [`04-agentic-instructions.md`](04-agentic-instructions.md)).

## Related

- [`../README.md`](../README.md): map of all documentation
- [`../architecture/README.md`](../architecture/README.md): how the requirements are realised
- [`../plan/README.md`](../plan/README.md): when they are delivered
- [`../decisions/`](../decisions/): the decisions that outrank this folder
- [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md) and [`../../AGENTS.md`](../../AGENTS.md): the conventions this folder links to
