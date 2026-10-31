/**
 * Domain vocabulary the bridge and the UI read without importing core. Names core exports are
 * re-exported from `@eternalus/core`; the rest mirror the core type named in the Sprint 1 contract
 * (docs/agents/prompts/2026-10-03-ultracode-sessions.md §2.2) until core exports them, so each
 * swap is a one-line `export type { … } from '@eternalus/core'`.
 */

export type { LegendClassId, PlayableTeam, Team } from '@eternalus/core';
