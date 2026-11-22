import type {
  EntitySnapshot,
  GameEventHandler,
  GameEventMap,
  GameEventType,
  Snapshot,
  Unsubscribe,
} from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { CathedralCutscene } from './CathedralCutscene';
import { CUTSCENE } from './CathedralCutscene.constants';

/** Stands in for `Simulation.on`: keeps the handlers, so a test emits the events by hand. */
class FakeEvents {
  public readonly handlers: { [K in GameEventType]?: GameEventHandler<K>[] } = {};

  public unsubscribed = 0;

  public readonly on = <K extends GameEventType>(
    type: K,
    handler: GameEventHandler<K>,
  ): Unsubscribe => {
    const list: GameEventHandler<K>[] = this.handlers[type] ?? [];
    list.push(handler);
    this.handlers[type] = list as (typeof this.handlers)[K];
    return () => {
      this.unsubscribed += 1;
    };
  };

  public emit<K extends GameEventType>(type: K, payload: GameEventMap[K]): void {
    for (const handler of this.handlers[type] ?? []) {
      handler(payload);
    }
  }
}

const TICK_RATE = 30;
const ERUPTION = 900;
const PAN = CUTSCENE.panSeconds * TICK_RATE;
const HOLD = CUTSCENE.holdSeconds * TICK_RATE;
const BURST = CUTSCENE.burstSeconds * TICK_RATE;
const GEM_AT = { x: 400, y: 300 };

const GEM: EntitySnapshot = {
  id: 'gem',
  kind: 'cathedral-gem',
  family: 'structure',
  definitionId: 'cathedral',
  team: 'neutral',
  transform: { ...GEM_AT, radius: 5, facing: { x: 1, y: 0 } },
  health: { current: 1, max: 1 },
  progression: null,
  aether: null,
  area: null,
  capture: null,
  gem: null,
};

/** The snapshot of `tick`: the gem stands and the eruption is upcoming until it fires. */
const snapshotAt = (tick: number, isDuel = false): Snapshot => ({
  tick,
  match: {
    phase: 'early-game',
    phaseEnteredTick: 0,
    upcoming: tick < ERUPTION ? [{ entryId: 'gem-eruption', tick: ERUPTION }] : [],
    countdownEndTick: 0,
    humanLegendId: null,
    ...(isDuel ? { duel: { kills: { light: 0, dark: 0 }, killTarget: 5 } } : {}),
  },
  entities: tick < ERUPTION ? [GEM] : [],
  hordes: [],
  teams: {
    light: { unitsRequested: 0, unitsSuppressed: 0, towersLostByLane: {} },
    dark: { unitsRequested: 0, unitsSuppressed: 0, towersLostByLane: {} },
  },
});

/**
 * A cut-scene that has seen every tick up to `tick`, as `Match` steps it: the gem erupts on the
 * eruption tick (when `hasErupted`), and `moving` says on which ticks the player moves.
 */
const runTo = (
  tick: number,
  options: { hasErupted?: boolean; isDuel?: boolean; moving?: (tick: number) => boolean } = {},
) => {
  const { hasErupted = true, isDuel = false, moving = () => false } = options;
  const events = new FakeEvents();
  const cutscene = new CathedralCutscene(events, TICK_RATE);
  for (let at = 1; at <= tick; at += 1) {
    if (at === ERUPTION && hasErupted) {
      events.emit('greater-boss-summoned', { bossId: 'greater-boss' });
    }
    cutscene.observe(snapshotAt(at, isDuel), moving(at));
  }
  return { cutscene, events };
};

describe('CathedralCutscene (Aryan 2026-11-22)', () => {
  it('leaves the camera on the player until the pan starts before the eruption', () => {
    expect(runTo(ERUPTION - PAN - 1).cutscene.focus()).toBeNull();
    expect(runTo(ERUPTION - PAN).cutscene.focus()).toEqual(GEM_AT);
  });

  it('holds on the Cathedral, shaking while it bursts, then hands the camera back', () => {
    const shaking = runTo(ERUPTION + 1).cutscene.focus();
    expect(shaking).not.toBeNull();
    expect(shaking).not.toEqual(GEM_AT);
    expect(Math.abs((shaking?.x ?? 0) - GEM_AT.x)).toBeLessThanOrEqual(CUTSCENE.shake.amplitude);

    expect(runTo(ERUPTION + BURST).cutscene.focus()).toEqual(GEM_AT);
    expect(runTo(ERUPTION + HOLD - 1).cutscene.focus()).toEqual(GEM_AT);
    expect(runTo(ERUPTION + HOLD).cutscene.focus()).toBeNull();
  });

  it('bursts at the gem from the eruption, growing until it ends', () => {
    expect(runTo(ERUPTION - 1).cutscene.burst()).toBeNull();
    expect(runTo(ERUPTION).cutscene.burst()).toEqual({ at: GEM_AT, progress: 0 });
    expect(runTo(ERUPTION + 9).cutscene.burst()).toEqual({ at: GEM_AT, progress: 9 / BURST });
    expect(runTo(ERUPTION + BURST).cutscene.burst()).toBeNull();
  });

  it('draws no burst when the gem never erupts', () => {
    expect(runTo(ERUPTION + 1, { hasErupted: false }).cutscene.burst()).toBeNull();
  });

  it('plays nothing in a Duel', () => {
    const { cutscene } = runTo(ERUPTION - 1, { isDuel: true });

    expect(cutscene.focus()).toBeNull();
  });

  it('is skipped by a fresh move press, not by a key already held when it started', () => {
    const held = runTo(ERUPTION, { moving: () => true });
    expect(held.cutscene.focus()).not.toBeNull();

    const pressed = runTo(ERUPTION, { moving: (tick) => tick === ERUPTION - 10 });
    expect(pressed.cutscene.focus()).toBeNull();
    expect(pressed.cutscene.burst()).not.toBeNull();
  });

  it('stops listening when destroyed', () => {
    const { cutscene, events } = runTo(1);

    cutscene.destroy();

    expect(events.unsubscribed).toBe(1);
  });
});
