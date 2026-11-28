import { describe, expect, it } from 'vitest';

import { damageStepsWithoutLaneProgress } from '../combat/__fixtures__/damageSteps';
import { DamagePipeline } from '../combat/DamagePipeline';
import { Health } from '../components/Health';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { CATHEDRAL_GEM } from '../content/structures/cathedralGem';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { CAPTURE_POINT } from '../content/zones/capturePoint';
import { ZONE_DEFINITIONS } from '../content/zones/zoneCatalogue';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import type { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import { CapturePoint } from '../entities/zones/CapturePoint';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { GameState } from '../state/GameState';
import type { MatchWorld } from '../state/MatchWorld';
import type { DamageSource } from '../state/GameEvents.types';
import { GemEruptionSystem } from './GemEruptionSystem';

const TICK_RATE = 30;
const GEM_AT = { x: 500, y: 500 };
const HALF = 30;
const square = (at: { x: number; y: number }) => [
  [
    { x: at.x - HALF, y: at.y - HALF },
    { x: at.x + HALF, y: at.y - HALF },
    { x: at.x + HALF, y: at.y + HALF },
    { x: at.x - HALF, y: at.y + HALF },
  ],
];

/**
 * A gem in a capture zone, a system, and helpers to add units and run passes.
 *
 * @param world - The map (lane routes for the minion strength curve), or `null`.
 * @param gemAt - Where the gem and the centre of its zone stand.
 */
const setUp = (world: MatchWorld | null = null, gemAt = GEM_AT) => {
  const state = new GameState(createDefaultGameConfig(), 1, world);
  const units = loadDefaultContent(TICK_RATE);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    {
      has: (id: string) =>
        units.has(id) || STRUCTURE_DEFINITIONS.has(id) || ZONE_DEFINITIONS.has(id),
      get: (id: string) =>
        units.has(id)
          ? units.get(id)
          : ZONE_DEFINITIONS.has(id)
            ? ZONE_DEFINITIONS.get(id)
            : STRUCTURE_DEFINITIONS.get(id),
    },
    undefined,
    loadWeapons(TICK_RATE),
  );
  const zone = new CapturePoint('zone-1', CAPTURE_POINT.id);
  zone.spawn({
    definition: CAPTURE_POINT,
    position: gemAt,
    team: 'neutral',
    area: square(gemAt),
  });
  state.entities.add(zone);
  const gem = factory.create('cathedral-gem', 'cathedral', { position: gemAt, team: 'neutral' });
  state.entities.add(gem);
  const system = new GemEruptionSystem(
    state,
    new DamagePipeline(damageStepsWithoutLaneProgress()),
    CATHEDRAL_GEM.eruption,
  );
  const add = (kind: string, id: string, at: { x: number; y: number }): Entity => {
    const entity = factory.create(kind, id, { position: at, team: 'light' });
    state.entities.add(entity);
    return entity;
  };
  const deaths: { entityId: string; killer: DamageSource }[] = [];
  state.events.on('entity-died', (died) => deaths.push(died));
  const pass = (): void => {
    system.update({ state, logger: new NullLogger() });
  };
  const erupt = (): void => {
    state.events.emit('greater-boss-summoned', { bossId: 'greater-boss' });
  };
  return { state, gem, add, deaths, pass, erupt };
};

const isDead = (entity: Entity): boolean => entity.getComponent(Health).isDead;

describe('GemEruptionSystem (DEC-371 "BOSS guards")', () => {
  it('does nothing until the gem erupts', () => {
    const { add, deaths, pass } = setUp();
    add('warrior', 'warrior', GEM_AT);

    pass();

    expect(deaths).toEqual([]);
  });

  it("kills every unit in the gem's capture zone, once, as no one's kill", () => {
    const { add, deaths, pass, erupt } = setUp();
    const legend = add('warrior', 'warrior', { x: GEM_AT.x - 10, y: GEM_AT.y });
    const mob = add('medium-mob', 'medium-assist-mob', { x: GEM_AT.x + 10, y: GEM_AT.y });

    erupt();
    pass();
    pass();

    const killer = { attackerId: null, kind: 'environment', definitionId: 'gem-eruption' };
    expect(deaths).toEqual([
      { entityId: legend.id, killer },
      { entityId: mob.id, killer },
    ]);
  });

  it('spares units outside the zone and anything that is no unit (the gem)', () => {
    const { gem, add, pass, erupt } = setUp();
    const outside = add('warrior', 'warrior', { x: GEM_AT.x + HALF + 5, y: GEM_AT.y });

    erupt();
    pass();

    expect(isDead(outside)).toBe(false);
    expect(gem.findComponent(Health)?.isDead ?? false).toBe(false);
  });

  it('kills a horde minion on its own half of the lane, past the strength that shrinks its hits (S1)', () => {
    // TWO_LANE_MAP lane-0 runs x 20 to x 180, so at x 55 a light minion has strength ≈ 1.28.
    const at = { x: 55, y: 20 };
    const { state, add, pass, erupt } = setUp(matchWorldOf(TWO_LANE_MAP), at);
    const minion = add('light-mob', 'light-minion', at);
    state.hordes.add({
      id: 'horde-1',
      team: 'light',
      weightClass: 'light',
      lane: 'lane-0',
      formationId: 'ranks',
      memberIds: [minion.id],
      progress: 0,
    });

    erupt();
    pass();

    expect(isDead(minion)).toBe(true);
  });
});
