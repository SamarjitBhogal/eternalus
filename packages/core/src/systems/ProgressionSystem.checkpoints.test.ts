import { describe, expect, it } from 'vitest';

import { Capturable } from '../components/Capturable';
import { Progression } from '../components/Progression';
import { DamagePipeline } from '../combat/DamagePipeline';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { LEVEL_CURVE_CATALOGUE } from '../content/progression/levelCurveCatalogue';
import { XP_SOURCES } from '../content/progression/xpSources';
import { CHECKPOINT_DEFENDER_LIMIT, CHECKPOINT_DEFENDERS } from '../content/structures/guardPlans';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { CATHEDRAL_CAPTURE_POINT } from '../content/zones/cathedralCapturePoint';
import { LevelMatchesXpInvariant } from '../diagnostics/invariants/LevelMatchesXpInvariant';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import type { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import { CapturePoint } from '../entities/zones/CapturePoint';
import type { GameEventMap } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { GuardRoster } from './GuardRoster';
import { ProgressionSystem } from './ProgressionSystem';

const TICK_RATE = 30;
const CENTER = { x: 100, y: 30 };
const HALF = 10;
const RULE = XP_SOURCES.checkpointCleared;

/** A neutral capture point, the content's defenders and XP, and Legends placed by the test. */
const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(TWO_LANE_MAP));
  const point = new CapturePoint('zone-1', CATHEDRAL_CAPTURE_POINT.id);
  point.spawn({
    definition: CATHEDRAL_CAPTURE_POINT,
    position: CENTER,
    team: 'neutral',
    area: [
      [
        { x: CENTER.x - HALF, y: CENTER.y - HALF },
        { x: CENTER.x + HALF, y: CENTER.y - HALF },
        { x: CENTER.x + HALF, y: CENTER.y + HALF },
        { x: CENTER.x - HALF, y: CENTER.y + HALF },
      ],
    ],
  });
  point.getComponent(Capturable).setOwner('neutral', state.tick);
  state.entities.add(point);
  const units = loadDefaultContent(TICK_RATE);
  const factory = new EntityFactory(createDefaultEntityRegistry(), units, undefined, {
    weapons: loadWeapons(TICK_RATE),
  });
  const roster = new GuardRoster(
    factory,
    units,
    {},
    CHECKPOINT_DEFENDERS,
    CHECKPOINT_DEFENDER_LIMIT,
  );
  const progression = new ProgressionSystem(state, {
    units,
    curves: LEVEL_CURVE_CATALOGUE,
    xpSources: XP_SOURCES,
  });
  const invariant = new LevelMatchesXpInvariant(LEVEL_CURVE_CATALOGUE);
  const violations: string[] = [];
  const awards: GameEventMap['xp-gained'][] = [];
  state.events.on('xp-gained', (award) => {
    if (award.cause === 'checkpoint-cleared') awards.push(award);
  });
  /** One tick in pipeline order: progression before the roster (`SpawnSystem`), then invariants. */
  const step = () => {
    progression.update({ state, logger: new NullLogger() });
    roster.update(state);
    violations.push(...invariant.check(state).map(({ message }) => message));
    state.advanceTick();
  };
  const legend = (x: number): Entity => {
    const entity = factory.create('warrior', 'warrior', {
      position: { x, y: CENTER.y },
      team: 'light',
    });
    state.entities.add(entity);
    return entity;
  };
  const defend = (checkpoint: number) => {
    roster.defend(state, point.id, checkpoint, 'neutral');
    step();
    const ids: string[] = [];
    state.guards.forEach(({ guardId, checkpoint: at }) => {
      if (guardId !== null && at === checkpoint) ids.push(guardId);
    });
    return ids;
  };
  const hit = (attacker: Entity, targetId: string) => {
    new DamagePipeline().apply(state, targetId, 1e6, {
      attackerId: attacker.id,
      kind: 'weapon',
      definitionId: 'test',
    });
  };
  const xpOf = (entity: Entity) => entity.getComponent(Progression).xp;
  return { state, point, factory, step, legend, defend, hit, xpOf, awards, violations };
};

describe('ProgressionSystem checkpoint XP through the guard roster (07 §7)', () => {
  it('shares the XP among the clearing Legends in range, biased toward the damage each dealt', () => {
    const { point, step, legend, defend, hit, xpOf, awards, violations } = setUp();
    const top = legend(CENTER.x);
    const helper = legend(CENTER.x + RULE.shareRadius - 1);
    const far = legend(CENTER.x + RULE.shareRadius + 20);
    const [last, ...rest] = defend(1);
    for (const id of rest) hit(top, id);
    hit(helper, last ?? '');
    step();
    const afterKills = [xpOf(top), xpOf(helper), xpOf(far)];
    expect(awards).toEqual([]);

    step();

    const xp = RULE.xp[1] ?? 0;
    const n = 2;
    const share = (part: number) => xp * (RULE.evenShare / n + (1 - RULE.evenShare) * part);
    expect(xpOf(top) - (afterKills[0] ?? 0)).toBeCloseTo(share(3 / 4), 6);
    expect(xpOf(helper) - (afterKills[1] ?? 0)).toBeCloseTo(share(1 / 4), 6);
    expect(xpOf(far)).toBe(afterKills[2]);
    expect(awards.map(({ entityId, victimId }) => [entityId, victimId])).toEqual([
      [top.id, point.id],
      [helper.id, point.id],
    ]);
    expect(violations).toEqual([]);
  });

  it('splits evenly when no Legend in range hurt the set (a minion cleared it)', () => {
    const { state, factory, step, legend, defend, hit, awards, violations } = setUp();
    const one = legend(CENTER.x);
    const two = legend(CENTER.x + 1);
    const minion = factory.create('light-mob', 'light-minion', { team: 'light', position: CENTER });
    state.entities.add(minion);
    for (const id of defend(1)) hit(minion, id);
    step();
    step();

    const half = (RULE.xp[1] ?? 0) / 2;
    expect(awards.map(({ entityId, amount }) => [entityId, amount])).toEqual([
      [one.id, half],
      [two.id, half],
    ]);
    expect(violations).toEqual([]);
  });

  it('pays nobody when no clearing Legend is in range, or the killer is unknown', () => {
    const { state, step, legend, defend, hit, awards, violations } = setUp();
    const far = legend(CENTER.x + RULE.shareRadius + 20);
    for (const id of defend(1)) hit(far, id);
    step();
    step();
    expect(awards).toEqual([]);

    legend(CENTER.x);
    for (const id of defend(2)) {
      new DamagePipeline().apply(state, id, 1e6, {
        attackerId: null,
        kind: 'environment',
        definitionId: 'lava',
      });
    }
    step();
    step();

    expect(awards).toEqual([]);
    expect(state.defenderDamage.size).toBe(0);
    expect(violations).toEqual([]);
  });

  it('pays one summed award when two sets of a point are cleared on the same tick', () => {
    const { step, legend, defend, hit, awards, violations } = setUp();
    const solo = legend(CENTER.x);
    const ids = [...defend(1), ...defend(2)];
    for (const id of ids) hit(solo, id);
    step();
    step();

    expect(awards.map(({ entityId, amount }) => [entityId, amount])).toEqual([
      [solo.id, (RULE.xp[1] ?? 0) + (RULE.xp[2] ?? 0)],
    ]);
    expect(violations).toEqual([]);
  });
});
