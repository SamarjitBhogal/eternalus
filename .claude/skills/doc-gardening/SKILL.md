---
name: doc-gardening
description: Find and fix stale documentation - broken links, invalid frontmatter, docs whose last-reviewed date is old, code/docs drift - and regenerate the docs index. Use when asked to tidy, audit or refresh docs.
---

# Doc gardening

Documentation is the agents' map of the repo, so it must stay accurate. This skill keeps
`docs/` healthy without silently deleting anything.

## Procedure

1. Run `npm run docs:check` (frontmatter schema, relative links, index freshness) and read the
   report. Fix every error it lists.
2. List docs with `last-reviewed` older than 30 days (`grep -r "last-reviewed" docs`). For each,
   compare the doc with the code it governs (`paths` frontmatter) and the phase docs; mark
   confirmed docs with today's date and fix drift you can prove. If a doc is obsolete, set
   `status: deprecated` and add a "Superseded by" line; never delete a doc without listing its
   content in the PR description.
3. Check the "single place of change" claims: registries, draw order, keybindings, system
   order. If code moved, update `docs/architecture/02-code-structure.md` and the package
   `AGENTS.md` folder tables.
4. Keep `AGENTS.md` short (target under 150 lines): move detail into the docs it links to;
   prune duplicated or contradictory rules (record why each control exists in
   `docs/process/guardrails.md`).
5. Regenerate the index: `npm run docs:index` (writes the file tables in `docs/README.md`).
6. Append a `docs/plan/PROGRESS.md` entry listing what changed. Run `npm run check`. Report
   verbatim. No commits unless asked.

## Done when

- `npm run docs:check` passes; every touched doc has a fresh `last-reviewed`; nothing was
  deleted without being listed; `npm run check` passes.
