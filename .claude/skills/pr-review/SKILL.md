---
name: pr-review
description: Review a branch or PR diff against AGENTS.md, the architecture docs and the AI-PR checklist, producing findings by severity without editing files. Use when asked to review, audit or check a change.
allowed-tools: Read, Grep, Glob, Bash(git diff *), Bash(git log *), Bash(git show *), Bash(npm run check*)
---

# PR review

Independent review is part of the harness: agents grade their own work generously, so a
second pass by a different agent or a human is required before merge
(`docs/agents/checklists.md`). This skill produces a structured review; it never edits.

## Procedure

1. Identify the diff: `git diff <base>...<head>` (base = the phase branch for task PRs, `main`
   for phase PRs) and `git log --oneline <base>..<head>`.
2. Run `npm run check` and record the verbatim result.
3. Walk `docs/agents/checklists.md` "AI-PR review checklist" and the architecture checklist:
   placement per `docs/architecture/02-code-structure.md`; layer imports (core purity, `ui/`
   rules, only `Canvas2dRenderer` touches the 2D context); determinism (no `Math.random`,
   `Date`, timers, unstable iteration or sort); SOLID/DRY (one class per file, no sibling-system
   calls, strategies not switches, registry line instead of edits everywhere); no magic numbers
   (content/config); tests are real (assert behaviour; no loosened assertions, `.skip`, `.only`,
   deleted tests, lowered thresholds); no `any`/`@ts-ignore`/unjustified `eslint-disable`; no
   new dependencies; scope (no drive-by refactors); docs and frontmatter updated; PROGRESS.md
   entry present; commit messages are Conventional Commits with an allowed scope.
4. For each finding: severity (`blocker` / `should-fix` / `nit`), file:line, what, why (cite the
   rule), suggested fix. Blockers include any guardrail weakening or product decision made by
   an agent.
5. Output: a Markdown review with a summary verdict (`approve` / `request-changes`), the
   verbatim `npm run check` result, and the findings table. Post it as the PR review or paste
   it back to the requester.

## Done when

- Every checklist item is explicitly marked pass/fail; findings cite files and rules; no files
  were modified.
