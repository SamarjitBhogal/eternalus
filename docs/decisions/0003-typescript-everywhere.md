---
title: 0003. TypeScript everywhere
description: Resolves the "only JS/HTML/CSS" wording of the requirements doc against the strict-TypeScript scaffold; read this when someone asks why the whole repo is TypeScript.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [adr, language, typescript]
related: ['docs/requirements/README.md', 'docs/reference/suggestions/discrepancies.md']
---

# 0003. TypeScript everywhere

- Status: accepted (product owner decision, 2026-09-30)
- Date: 2026-09-30

## Context

The requirements document opens with "We are only permitted JavaScript, HTML, and CSS for the
MVP. TypeScript is allowed only where it is needed for OOP if JavaScript cannot do it cleanly",
while its MVP list says "JavaScript, TypeScript, CSS, HTML ONLY!!! See the current repo for
details". The scaffold is a strict TypeScript monorepo (`strict`, `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, ESLint `strictTypeChecked`). The same document mandates
OOP, SOLID, DRY and design patterns "always", an `Entity` class hierarchy, and a later
translation to a real engine (C# in Unity or C++ in Unreal).

Options considered:

1. Full TypeScript everywhere (the scaffold as-is).
2. TypeScript in `packages/core` only; the client in JavaScript with JSDoc types.
3. Plain JavaScript with JSDoc everywhere (most literal reading of the first sentence).

## Decision

**Option 1: TypeScript everywhere.** The whole game is object-oriented, so the "needed for
OOP" clause applies to all of it: interfaces, abstract classes, access modifiers, generics for
the typed event bus and discriminated unions for commands are the OOP tooling SOLID relies on,
and none of them exist in JavaScript as language features. Strict types are also the single
strongest automated guardrail for AI-generated code, and TypeScript translates to C#/C++ far
more directly than dynamic JavaScript. TypeScript compiles to the permitted JavaScript, and the
product owner's own MVP list allows it.

## Consequences

- The existing tsconfig/ESLint guardrails stay and are extended, not relaxed
  (`docs/process/guardrails.md`).
- Every architecture document uses TypeScript sketches; JSDoc-only code is not accepted.
- The team should confirm the wording with the instructor once (tracked with DEC-02 in
  `INBOX.md`); the fallback, if TypeScript were ever refused, is a compiled JavaScript build
  artefact, which the Vite pipeline already produces.
