---
name: Bug report
about: A defect with a deterministic reproduction
title: '[bug] <short description>'
labels: bug
---

## What happened

<!-- Actual behaviour. Paste any invariant-violation log line (id, tick, entity ids). -->

## What should happen

<!-- Expected behaviour, with the reference or requirement it comes from. -->

## Reproduction

- Seed: <!-- match seed -->
- Replay id / command log: <!-- attach or paste (docs/architecture/15-diagnostics-and-runtime-testing.md) -->
- Steps (if manual): <!-- 1. … 2. … -->
- Branch / commit: <!-- git rev-parse --short HEAD -->

## Environment

<!-- OS, browser + version, Node version (`node -v`), display scale (DPR) -->

## Notes

<!-- Screenshots, perf overlay numbers, suspected system. -->

Every bug fix ships with a test that failed before the fix (CONTRIBUTING.md §6).
