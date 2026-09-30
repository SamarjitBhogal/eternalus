---
name: adr
description: Draft an Architecture Decision Record in docs/decisions from the template, numbered next in sequence, for a guardrail change or design decision. Use when a change needs a recorded decision.
disable-model-invocation: true
---

# ADR

Guardrail changes and design decisions are recorded as ADRs (`docs/process/guardrails.md` §4).
Agents draft; humans decide. This skill is manual (`/adr`) because an ADR is a product-level
artefact.

## Procedure

1. Find the next number: list `docs/decisions/` and take the highest `NNNN` + 1.
2. Copy `docs/decisions/0000-template.md` to `docs/decisions/NNNN-<kebab-title>.md`.
3. Fill in: status `proposed`, today's date, Context (the problem and constraints, with links to
   the requirement or issue), Decision (stated plainly; options considered with one line each),
   Consequences (easier / harder / must watch). Keep it under 60 lines.
4. If the ADR changes a guardrail, list the config change and the `docs/process/guardrails.md`
   table row that must change in the same PR.
5. Link the ADR from the doc it affects (`related:` frontmatter) and from `docs/README.md`'s
   decisions table (run `npm run docs:index`).
6. Do not mark it `accepted`; the product owner does that.
