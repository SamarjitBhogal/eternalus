---
name: verify
description: Run the full quality gate (npm run check) plus the docs check and report the verbatim result with a pass/fail summary. Use before declaring any task done or opening a PR.
allowed-tools: Bash(npm run check*), Bash(npm run docs:*), Bash(git status *), Read
---

# Verify

The Definition of done in `AGENTS.md` is "`npm run check` passes and the result is reported
verbatim". This skill is that step.

## Procedure

1. `git status --short` - list changed files; make sure nothing unintended is included.
2. `npm run check` - format, lint, typecheck, knip, tests with coverage thresholds, build, docs
   check. Do not run the steps selectively unless a step is being debugged.
3. Report the verbatim tail of the output for each failing step, then a one-line summary per
   step (pass/fail). Never summarise a failure as a pass. Never fix a failure by weakening a
   guardrail (thresholds, lint rules, `@ts-ignore`, skipped tests).
4. If everything passes, append the `docs/plan/PROGRESS.md` entry for the task (date,
   phase/sprint, branch, what, checks run, next step).
5. Verify is the Definition of done, not the end: before a PR is opened, the pre-PR gate in
   `AGENTS.md` follows (critic, ponytail, then this skill again on the post-ponytail code).
