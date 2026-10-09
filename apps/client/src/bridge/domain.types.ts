/**
 * Domain vocabulary the bridge needs before `@eternalus/core` exports it. Each alias mirrors the
 * core type named in the Sprint 1 contract (docs/agents/prompts/2026-10-03-ultracode-sessions.md
 * §2.2) so the swap is a one-line `export type { … } from '@eternalus/core'` per name.
 */

// TODO(sam): re-export PlayableTeam and Team from @eternalus/core when session A merges.
/** A team a player or bot can be on. */
export type PlayableTeam = 'light' | 'dark';

/** Who owns something. Neutral things belong to no player team. */
export type Team = PlayableTeam | 'neutral';

// TODO(sam): re-export LegendClassId from @eternalus/core when session C merges.
/** Content id of a Legend class (`'warrior'`, `'sentinel'`, `'magus'`); never a closed union here. */
export type LegendClassId = string;
