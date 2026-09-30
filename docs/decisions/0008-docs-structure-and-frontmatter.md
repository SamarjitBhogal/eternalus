---
title: 0008. Documentation tree and YAML frontmatter
description: Fixes the docs/ folder structure (plan, architecture, reference, requirements, research, process, agents, decisions, changelog) and the frontmatter schema that lets humans and agents find the right document; read this before adding or moving a doc.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [adr, docs, frontmatter]
related: ['docs/README.md', 'docs/requirements/03-organization-guidelines.md']
---

# 0008. Documentation tree and YAML frontmatter

- Status: accepted (product owner decision, 2026-09-30)
- Date: 2026-09-30

## Context

The requirements ask for a documentation set (plan per phase with sprints; architecture split
by theme; the game reference split by focus with a suggestions folder; requirements;
research) organised "in whichever way makes the most sense for humans and agents", with
"YAML, Markdown, or whatever frontmatter makes it easiest for a task-focused agent to get to
their specific instruction/reference documents". The scaffold already had `docs/` with
`architecture.md`, `guardrails.md`, `agent-workflow.md` and ADRs. Tools read different
frontmatter keys (`paths` in Claude rules/skills, `globs` in Cursor, `applyTo` in Copilot).

## Decision

1. Extend the existing `docs/` folder rather than create a second documentation root. Themed
   sub-folders: `plan/`, `architecture/`, `reference/{game-design,suggestions,source}/`,
   `requirements/`, `research/`, `process/`, `agents/`, `decisions/`, `changelog/`. The old
   single files move (`guardrails.md` → `process/`, `agent-workflow.md` → `agents/running-agents.md`)
   and `architecture.md` is superseded by `architecture/` (its content is preserved in 01, 03, 08).
2. Every Markdown file under `docs/` carries YAML frontmatter with exactly these keys:
   `title` (equals the H1), `description` (one sentence: what and when to read), `audience`
   (subset of `humans`, `agents`), `status` (`draft` | `active` | `deprecated`), `owner`,
   `last-reviewed` (ISO date), `tags`, and optionally `paths` (globs of the code the doc governs)
   and `related`. Root files (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `README.md`,
   `CONTRIBUTING.md`, `INBOX.md`) carry no frontmatter because Codex and Gemini concatenate
   them verbatim into the prompt.
3. `scripts/docs/check-docs.mjs` validates the schema and relative links and regenerates the
   index tables in `docs/README.md`; `npm run docs:check` is part of `npm run check`.

## Consequences

- Agents locate their instructions by `paths` (the doc governing the files they touch) and by
  `tags`; humans navigate by `docs/README.md`.
- Moving or renaming a doc requires updating links; the docs check fails otherwise.
- `last-reviewed` older than 30 days is a gardening trigger (`doc-gardening` skill).
- Existing ADRs 0000–0002 gained frontmatter so the schema is uniform.
