---
title: 0004. React and Redux Toolkit for menus and HUD
description: Keeps React + Redux Toolkit + Vite as the presentation layer while the game itself stays a custom Canvas 2D engine with no game framework; read this when questioning UI libraries under the "no game engine" rule.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [adr, ui, react, redux]
related: ['docs/architecture/13-game-interface.md', 'docs/decisions/0002-css-modules.md']
---

# 0004. React and Redux Toolkit for menus and HUD

- Status: accepted (product owner decision, 2026-09-30; instructor confirmation received, DEC-02, 2026-10-03)
- Date: 2026-09-30

## Context

The requirements forbid a game engine for the MVP and say "JavaScript, TypeScript, CSS, HTML
only". The scaffold uses React 19, Redux Toolkit and Vite for menus and HUD; the game world is
drawn by a custom Canvas 2D renderer and simulated by pure TypeScript. React is a UI library,
not a game engine, but a strict reading of the course rule could exclude any framework.

Options considered:

1. Keep React + Redux Toolkit (existing ADR 0002 territory; zero churn).
2. Keep React, replace Redux with a small typed observable store of our own.
3. No UI framework: vanilla DOM + CSS with a home-made component system.

## Decision

**Option 1.** Menus, settings and HUD are a disposable presentation layer: when the project
moves to a real engine they are rebuilt in that engine's UI system regardless. What must stay
engine-agnostic is the simulation (`packages/core`) and the content, and those import nothing
from React. Redux Toolkit stays because it is already wired, typed, well known to the team and
the throttled-snapshot bridge (`docs/architecture/13-game-interface.md` §5) is designed around a
single store. The team confirms with the instructor that UI libraries are permitted.

## Consequences

- `ui/` may import only `bridge/`, `ui/`, `styles/`; the game never imports React. Enforcing
  this with ESLint `no-restricted-imports` is Phase 1 work.
- If the instructor refuses UI libraries, only `apps/client/src/ui/` and `bridge/store.ts`
  change: the bridge contract (`TypedEventBus` + selectors) is kept and a DOM renderer replaces
  React components. Nothing in `packages/core` or `game/` is affected.
- Every UI element that names a control renders it through `<KeyGlyph action>` so the
  rebinding requirement holds regardless of the UI technology.
