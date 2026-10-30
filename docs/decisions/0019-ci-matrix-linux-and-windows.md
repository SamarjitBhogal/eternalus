---
title: 0019. CI matrix runs Linux and Windows
description: CI runs the full npm run check on ubuntu-latest and windows-latest only; macOS is covered by the git hooks (check:quick) and the developer's local npm run check, to save Actions minutes; read this before changing the CI matrix or NFR-019 / ES-07.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-29
tags: [adr, ci, guardrail, process]
related:
  [
    '.github/workflows/ci.yml',
    'docs/process/guardrails.md',
    'docs/requirements/05-engineering-standards.md',
    'docs/requirements/06-mvp-requirements.md',
  ]
---

# 0019. CI matrix runs Linux and Windows

- Status: accepted (decided by the repository admin, SamarjitBhogal, 2026-10-29; recorded on PR #50)
- Date: 2026-10-29

## Context

CI ran `npm run check` on `ubuntu-latest`, `macos-latest` and `windows-latest` (NFR-019, ES-07).
The repository is on GitHub's education plan, where Actions minutes are limited and macOS runners
use them roughly ten times faster than Linux.

Eternalus is browser-only, so the CI operating system does not change what ships. The matrix
exists to keep the developer tooling (npm scripts, git hooks, `scripts/*.mjs`) working on every
OS the team uses. For that tooling macOS behaves like Linux (both POSIX); Windows is where paths,
shell syntax and line endings differ.

## Decision

1. CI runs the full `npm run check` on `ubuntu-latest` and `windows-latest`. `macos-latest` is
   removed from the matrix and from the required status checks.
2. macOS is covered by the developer's machine: the git hooks run `check:quick` (no-JS check,
   typecheck, lint) on every commit and push, and the Definition of done requires a full local
   `npm run check`. The hooks alone are not full coverage.
3. NFR-019, ES-07 and the requirements overview are amended to match.

Options considered: keep all three OSes (most coverage, highest cost); Linux only (cheapest, but
Windows-only tooling breaks would reach teammates unseen); run macOS only on phase PRs into `main`
(keeps some macOS coverage; a fallback if a macOS-only break ever slips through).

## Consequences

- Each CI run costs far fewer minutes.
- A macOS-only break in format, knip, tests, build or the docs check is caught only when a macOS
  developer runs `npm run check` locally, not in CI.
- The `npm run check (macos-latest)` required check must be removed from the `main` protection
  and the "phase branches" ruleset, or PRs wait on a check that never runs.
- If a macOS-only break reaches a phase branch, revisit this ADR (the `main`-only option above).
