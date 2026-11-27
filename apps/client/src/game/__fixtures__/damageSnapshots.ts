/**
 * Test support: small snapshots for the damage-number tests (`DamageBadges`, `DamageBadgeLayer`).
 * Imported only by tests.
 */
import type { EntitySnapshot, Snapshot } from '@eternalus/core';

/** A dark mob at (`x`, `y`) with 100 max health; `hasHealth` false makes it unhurtable. */
export const mobAt = (id: string, x: number, y = 0, hasHealth = true): EntitySnapshot => ({
  id,
  kind: 'mob',
  family: 'mob',
  definitionId: id,
  team: 'dark',
  transform: { x, y, radius: 0.4, facing: { x: 1, y: 0 } },
  health: hasHealth ? { current: 100, max: 100 } : null,
  progression: null,
  aether: null,
  area: null,
  capture: null,
  gem: null,
  elevation: null,
});

/** A snapshot of `entities` at `tick`, whose human Legend is `me`. */
export const snapshotAt = (tick: number, entities: readonly EntitySnapshot[]): Snapshot => ({
  tick,
  match: {
    phase: 'early-game',
    phaseEnteredTick: 0,
    upcoming: [],
    countdownEndTick: 0,
    humanLegendId: 'me',
  },
  entities: [...entities],
  hordes: [],
  teams: {
    light: { unitsRequested: 0, unitsSuppressed: 0, towersLostByLane: {} },
    dark: { unitsRequested: 0, unitsSuppressed: 0, towersLostByLane: {} },
  },
});
