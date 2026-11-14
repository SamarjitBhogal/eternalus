import { describe, expect, it } from 'vitest';

import { casterState } from '../abilities/__fixtures__/casterState';
import { CastValidator } from '../abilities/CastValidator';
import { createDefaultAbilityRegistry } from '../abilities/defaultAbilityRegistry';
import { loadAbilities } from '../content/abilities/loadAbilities';
import { Perception } from './perception/Perception';
import type { BotTurn } from './BotLegendController.types';
import { NORMAL_BOT } from '../content/ai/difficulties/normal';
import { SeededRandom } from '../utils/SeededRandom';
import { allReady, onlyReady } from '../state/__fixtures__/stubReadiness';
import { pickReadySlot } from './pickReadySlot';

const AIM = { point: { x: 5, y: 0 }, targetId: null };

/** A turn for the Warrior (`entity-1`, four filled slots) whose RNG starts from `seed`. */
const turnWith = (seed: number): BotTurn => {
  const { state, caster } = casterState();
  const memory = { lane: '', isRetreating: false, targetId: null, nextCastTick: 0 };
  return {
    state,
    id: caster.id,
    team: 'light',
    position: { x: 0, y: 0 },
    difficulty: NORMAL_BOT,
    perception: new Perception(state),
    rng: new SeededRandom(seed),
    memory,
    next: memory,
    commands: [],
    enemy: null,
    objective: null,
    destination: null,
  };
};

describe('pickReadySlot (DEC-205)', () => {
  it('picks only a slot the readiness accepts', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const slot = pickReadySlot(turnWith(seed), onlyReady('ability-2', 'ability-3'), AIM);
      expect(['ability-2', 'ability-3']).toContain(slot);
    }
  });

  it('never picks an empty slot, even when the readiness accepts it', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const slot = pickReadySlot(turnWith(seed), allReady, AIM);
      expect(['ability-1', 'ability-2', 'ability-3', 'ability-4']).toContain(slot);
    }
  });

  it('reaches every ready slot over many seeds', () => {
    const seen = new Set<string | null>();
    for (let seed = 1; seed <= 60; seed += 1) {
      seen.add(pickReadySlot(turnWith(seed), onlyReady('ability-1', 'ability-3'), AIM));
    }
    expect([...seen].sort()).toEqual(['ability-1', 'ability-3']);
  });

  it('gives the same pick for the same seed', () => {
    const picks = (): (string | null)[] =>
      [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => pickReadySlot(turnWith(seed), allReady, AIM));
    expect(picks()).toEqual(picks());
  });

  it('returns null and leaves the RNG untouched when nothing is ready', () => {
    const turn = turnWith(3);
    const before = turn.rng.getState();

    expect(pickReadySlot(turn, onlyReady(), AIM)).toBeNull();
    expect(turn.rng.getState()).toEqual(before);
  });

  it('picks nothing while the match holds units idle (DEC-88), so a bot sends no cast then', () => {
    const readiness = new CastValidator(createDefaultAbilityRegistry(loadAbilities(30)));
    const turn = turnWith(1);

    expect(pickReadySlot(turn, readiness, AIM)).toBe('ability-1'); // Blade Runner, the one built

    turn.state.match.holdIdle(true);
    expect(pickReadySlot(turn, readiness, AIM)).toBeNull();
  });
});
