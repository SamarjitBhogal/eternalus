import { describe, expect, it } from 'vitest';

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
import { GameState } from '../state/GameState';
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

/** A gem in a capture zone, a system, and helpers to add units and run passes. */
const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1);
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
    position: GEM_AT,
    team: 'neutral',
    area: square(GEM_AT),
  });
  state.entities.add(zone);
  const gem = factory.create('cathedral-gem', 'cathedral', { position: GEM_AT, team: 'neutral' });
  state.entities.add(gem);
  const system = new GemEruptionSystem(state, new DamagePipeline(), CATHEDRAL_GEM.eruption);
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
  return { gem, add, deaths, pass, erupt };
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
});
