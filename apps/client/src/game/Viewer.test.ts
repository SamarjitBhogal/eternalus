import type { EntitySnapshot, Snapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { Viewer } from './Viewer';

/** An entity of `team`, hidden (Veiled) when `isHidden`. */
const entity = (id: string, team: EntitySnapshot['team'], isHidden = false): EntitySnapshot => ({
  id,
  kind: 'legend',
  family: 'legend',
  definitionId: id,
  team,
  transform: { x: 0, y: 0, radius: 0.4, facing: { x: 1, y: 0 } },
  health: { current: 10, max: 10 },
  progression: null,
  aether: null,
  area: null,
  capture: null,
  statuses: null,
  projectile: null,
  swing: null,
  ...(isHidden && { isHidden: true }),
});

const snapshotOf = (entities: EntitySnapshot[]): Snapshot => ({
  tick: 1,
  match: {
    phase: 'early-game',
    phaseEnteredTick: 0,
    upcoming: [],
    countdownEndTick: 0,
    humanLegendId: 'me',
  },
  player: null,
  entities,
  hordes: [],
  teams: {
    light: { unitsRequested: 0, unitsSuppressed: 0, towersLostByLane: {} },
    dark: { unitsRequested: 0, unitsSuppressed: 0, towersLostByLane: {} },
  },
});

const PLAYER = entity('me', 'light');
const HIDDEN_ALLY = entity('pal', 'light', true);
const HIDDEN_FOE = entity('foe', 'dark', true);
const HIDDEN_CAMP = entity('camp', null, true);
const FOE = entity('seen', 'dark');

describe('Viewer', () => {
  it("names the player's team from the first snapshot with the player, also after it dies", () => {
    const viewer = new Viewer('me');
    expect(viewer.team).toBeNull();

    viewer.observe(snapshotOf([PLAYER, FOE]));
    viewer.observe(snapshotOf([FOE]));

    expect(viewer.team).toBe('light');
  });

  it('fades a hidden unit of its own team, leaves out every other hidden unit, and shows the rest (DEC-266)', () => {
    const viewer = new Viewer('me');
    viewer.observe(snapshotOf([PLAYER]));

    expect([HIDDEN_ALLY, HIDDEN_FOE, HIDDEN_CAMP, FOE].map(viewer.visibilityOf)).toEqual([
      'faded',
      'hidden',
      'hidden',
      'shown',
    ]);
  });

  it("leaves out every hidden unit while the player's team is not known yet, so nothing leaks", () => {
    const viewer = new Viewer('me');
    viewer.observe(snapshotOf([FOE]));

    expect([HIDDEN_ALLY, HIDDEN_FOE, HIDDEN_CAMP].map(viewer.visibilityOf)).toEqual([
      'hidden',
      'hidden',
      'hidden',
    ]);
  });

  it('fades every hidden unit when there is no player (sim mode)', () => {
    const viewer = new Viewer(null);
    viewer.observe(snapshotOf([PLAYER]));

    expect(viewer.team).toBeNull();
    expect([HIDDEN_ALLY, HIDDEN_FOE, HIDDEN_CAMP, FOE].map(viewer.visibilityOf)).toEqual([
      'faded',
      'faded',
      'faded',
      'shown',
    ]);
  });
});
