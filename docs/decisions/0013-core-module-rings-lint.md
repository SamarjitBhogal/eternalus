---
title: 0013. Core module rings enforced by lint
description: Inside packages/core, modules form rings from utils/teams outward to systems, and an ESLint no-restricted-imports block per folder stops a module from importing a ring further out; read this before adding a core folder or an import across core folders.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-07
tags: [adr, architecture, core, lint, guardrail]
related:
  [
    'docs/architecture/01-layered-oop-model.md',
    'docs/architecture/02-code-structure.md',
    'packages/core/AGENTS.md',
    'eslint.config.js',
  ]
---

# 0013. Core module rings enforced by lint

- Status: proposed (session C, 2026-10-07; awaiting the owner's sign-off in `INBOX.md`)
- Date: 2026-10-07

## Context

`packages/core` is L2 Domain, the innermost layer (`01-layered-oop-model.md`). The may-import
table in `02-code-structure.md` §2 orders the core folders, but until now only review checked it;
§11 recommends one `no-restricted-imports` block per folder "as folders appear". Sprint 1.2 adds
`content/` catalogues, `components/` and `entities/`, the first folders where a wrong import would
create a cycle or pull game rules into data.

## Decision

Inside core, modules form rings from the inside out: `utils/` and `teams/`, then `content/`, then
`components/`, then `entities/`, then `systems/`, `state/`, `commands/`, `ai/`, `diagnostics/`
and `Simulation.ts`. A module may import its own ring and the rings inside it, never one further
out, with the exceptions §2 already allows: `entities/` may import **types** from `state/`. One
self-contained block near the end of `eslint.config.js` enforces this for `utils/`, `teams/`,
`content/`, `components/` and `entities/` (test files are exempt); the outer folders stay checked
in review until their own blocks are added.

## Consequences

- A wrong inward import fails `npm run lint` with a message that names the ring, instead of being
  caught in review or not at all.
- Adding a core folder means placing it in a ring and, if it is inner, adding its line to the block.
- `02-code-structure.md` §11 should link this ADR once `feat/sim-kernel` (PR #13), which edits that
  section, has merged.
