---
title: 0001. Monorepo with npm workspaces and TypeScript project references
description: Why the repo is one npm-workspaces monorepo with tsc -b project references and core consumed as TypeScript source; read this before adding a package or build tooling.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [adr, monorepo, tooling]
---

# 0001. Monorepo with npm workspaces and TypeScript project references

- Status: accepted
- Date: 2026-09-26

## Context

We have a pure simulation and a browser client that must share types while keeping a strict boundary. The team is small, uses npm already, and runs many AI agents that need simple, predictable tooling.

## Decision

Use a single repository with **npm workspaces** (`packages/core`, `apps/client`) and **TypeScript project references** built with `tsc -b`. Core is consumed as TypeScript source through its `exports` map (`@eternalus/core` → `src/index.ts`); Vite compiles it. No Nx/Turborepo/pnpm.

## Consequences

- One install, one lockfile, one `npm run check`. Packages typecheck in dependency order.
- The `exports` map makes deep imports into core unresolvable, backing architecture rule 3.
- No task caching: if checks become slow, revisit (e.g. Turborepo) with a new ADR.
- Adding a package means adding it to the root `tsconfig.json` references and `knip.json`.
