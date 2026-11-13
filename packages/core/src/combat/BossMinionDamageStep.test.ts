import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { BOSS_MINION_DAMAGE_TAKEN } from '../content/mobs/minionModifiers';
import { MOB_DEFINITIONS } from '../content/mobs/mobCatalogue';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import { BossMinionDamageStep } from './BossMinionDamageStep';
import { DamagePipeline } from './DamagePipeline';

/** A neutral capture point boss and a heavy guard, a light horde minion, and a dark Warrior. */
const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(30),
    undefined,
    loadWeapons(30),
  );
  const add = (kind: string, id: string, team: 'light' | 'dark' | 'neutral') => {
    const entity = factory.create(kind, id, { team, position: { x: 0, y: 0 } });
    state.entities.add(entity);
    return entity.id;
  };
  const boss = add('heavy-mob', 'capture-point-boss', 'neutral');
  const guard = add('heavy-mob', 'heavy-guard', 'neutral');
  const minion = add('light-mob', 'light-minion', 'light');
  const legend = add('warrior', 'warrior', 'dark');
  state.hordes.add({
    id: 'horde-1',
    team: 'light',
    weightClass: 'light',
    lane: 'lane-0',
    formationId: 'ranks',
    memberIds: [minion],
    progress: 0,
  });
  return { state, boss, guard, minion, legend };
};

/** The share of a minion's hit the capture point boss takes, from content. */
const SHARE = BOSS_MINION_DAMAGE_TAKEN['capture-point-boss'] ?? Number.NaN;

const hit = (attackerId: string | null, targetId: string) => ({
  targetId,
  amount: 100,
  source: { attackerId, kind: 'weapon', definitionId: 'x' } as const,
});

describe('BossMinionDamageStep', () => {
  it("cuts a minion's hit on the boss to its content share, and leaves every other hit whole", () => {
    const { state, boss, guard, minion, legend } = setUp();
    const step = new BossMinionDamageStep(BOSS_MINION_DAMAGE_TAKEN, MOB_DEFINITIONS.ids);

    expect(step.adjust(hit(minion, boss), state)).toBeCloseTo(100 * SHARE);
    expect(step.adjust(hit(legend, boss), state)).toBe(100);
    expect(step.adjust(hit(null, boss), state)).toBe(100);
    expect(step.adjust(hit(minion, guard), state)).toBe(100);
    expect(step.adjust(hit(minion, legend), state)).toBe(100);
  });

  it("takes its share of a minion's hit off the boss's health through the default pipeline", () => {
    const { state, boss, minion, legend } = setUp();
    const pipeline = new DamagePipeline();
    const health = state.entities.get(boss)?.getComponent(Health);
    const before = health?.current ?? 0;

    pipeline.apply(state, boss, 100, hit(minion, boss).source);
    expect(before - (health?.current ?? 0)).toBeCloseTo(100 * SHARE);
    pipeline.apply(state, boss, 100, hit(legend, boss).source);
    expect(before - (health?.current ?? 0)).toBeCloseTo(100 * SHARE + 100);
  });

  it.each([
    [{ 'no-such-mob': 0.25 }, /not a mob definition id/],
    [{ 'capture-point-boss': 0 }, /share in \(0, 1\]/],
    [{ 'capture-point-boss': 1.5 }, /share in \(0, 1\]/],
    [{ 'capture-point-boss': Number.NaN }, /share in \(0, 1\]/],
  ])('rejects the table %o', (table, message) => {
    expect(() => new BossMinionDamageStep(table, MOB_DEFINITIONS.ids)).toThrow(message);
  });
});
