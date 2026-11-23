import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../combat/DamagePipeline';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { Health } from '../components/Health';
import { CathedralGemState } from '../components/CathedralGemState';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { CATHEDRAL_GEM } from '../content/structures/cathedralGem';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { ZONE_DEFINITIONS } from '../content/zones/zoneCatalogue';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import type { Entity } from '../entities/Entity';
import { GameState } from '../state/GameState';
import { CathedralGemSystem } from './CathedralGemSystem';
import { StatusEffectSystem } from './StatusEffectSystem';

const TICK_RATE = 30;
const GEM_AT = { x: 100, y: 100 };
/** `gem-shock` (1 s) plus the 5 extra ticks of DEC-292. */
const GLOW_TICKS = TICK_RATE + 5;

const setUp = () => {
  const config = createDefaultGameConfig();
  const state = new GameState(config, 1);
  const units = loadDefaultContent(TICK_RATE);
  const definitions = {
    has: (id: string) => units.has(id) || STRUCTURE_DEFINITIONS.has(id) || ZONE_DEFINITIONS.has(id),
    get: (id: string) =>
      units.has(id)
        ? units.get(id)
        : ZONE_DEFINITIONS.has(id)
          ? ZONE_DEFINITIONS.get(id)
          : STRUCTURE_DEFINITIONS.get(id),
  };
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    definitions,
    undefined,
    loadWeapons(TICK_RATE),
  );
  const loaded = loadStatusEffects(TICK_RATE, 2);
  const applier = new StatusEffectApplier(loaded);
  const system = new CathedralGemSystem(state, applier, loaded, CATHEDRAL_GEM);
  const statusSystem = new StatusEffectSystem(new DamagePipeline(), applier);
  const add = (entity: Entity): Entity => {
    state.entities.add(entity);
    return entity;
  };
  const gem = add(
    factory.create('cathedral-gem', 'cathedral', { position: GEM_AT, team: 'neutral' }),
  );
  const warrior = (at: { x: number; y: number }, team: 'light' | 'dark' | 'neutral' = 'light') =>
    add(factory.create('warrior', 'warrior', { position: at, team }));
  const tick = () => {
    state.advanceTick();
    system.update({ state, logger: new NullLogger() });
  };
  /** A tick with the statuses running too, as in the pipeline. */
  const fullTick = () => {
    state.advanceTick();
    statusSystem.update({ state, logger: new NullLogger() });
    system.update({ state, logger: new NullLogger() });
  };
  const statusIdsOf = (entity: Entity) =>
    entity.getComponent(StatusEffects).active.map(({ definition, sourceId }) => ({
      id: definition.id,
      sourceId,
    }));
  return { state, factory, gem, warrior, tick, fullTick, statusIdsOf, add };
};

const FAR = { x: GEM_AT.x + 40, y: GEM_AT.y };
const SWORD = { kind: 'weapon', definitionId: 'raptor-talons' } as const;

describe('CathedralGemSystem (DEC-291, DEC-292)', () => {
  it('shocks and burns whoever hits the gem, from the environment, and lights its glow', () => {
    const { state, gem, warrior, tick, statusIdsOf } = setUp();
    const hitter = warrior(FAR);

    const result = new DamagePipeline().apply(state, gem.id, 45, {
      ...SWORD,
      attackerId: hitter.id,
    });
    tick();

    expect(result).toEqual({ applied: false, reason: 'blocked' });
    expect(statusIdsOf(hitter)).toEqual([
      { id: 'gem-shock', sourceId: null },
      { id: 'gem-burn', sourceId: null },
    ]);
    expect(gem.getComponent(CathedralGemState)).toMatchObject({
      glowTicksLeft: GLOW_TICKS,
      glowHits: 1,
      ticksSinceHit: 0,
    });
  });

  it('glows brighter with each hit while lit, then goes dark and forgets the hits', () => {
    const { state, gem, warrior, tick } = setUp();
    const hitter = warrior(FAR);
    const hit = () =>
      new DamagePipeline().apply(state, gem.id, 45, { ...SWORD, attackerId: hitter.id });
    const glow = gem.getComponent(CathedralGemState);

    hit();
    tick();
    hit();
    tick();
    expect(glow.glowHits).toBe(2);

    for (let at = 0; at < GLOW_TICKS; at += 1) tick();
    expect(glow).toMatchObject({ glowTicksLeft: 0, glowHits: 0, ticksSinceHit: GLOW_TICKS });
  });

  it('ignores a blocked hit with no attacker and one the gem itself made', () => {
    const { state, gem, tick } = setUp();
    new DamagePipeline().apply(state, gem.id, 10, { ...SWORD, attackerId: null });
    new DamagePipeline().apply(state, gem.id, 10, { ...SWORD, attackerId: gem.id });
    tick();

    expect(gem.getComponent(CathedralGemState).ticksSinceHit).toBeNull();
  });

  it('never strikes a unit that only stands against the gem (DEC-346)', () => {
    const { gem, warrior, tick, statusIdsOf } = setUp();
    const reach = gem.getComponent(Transform).radius;
    const against = warrior({ x: GEM_AT.x + reach, y: GEM_AT.y });
    const glow = gem.getComponent(CathedralGemState);

    for (let at = 0; at < TICK_RATE; at += 1) tick();

    expect(statusIdsOf(against)).toEqual([]);
    expect(glow.ticksSinceHit).toBeNull();
  });

  it('shows the colour of the team holding the capture point it stands in', () => {
    const { state, factory, gem, tick, add } = setUp();
    const square = (x: number) => [
      { x: x - 30, y: GEM_AT.y - 30 },
      { x: x + 30, y: GEM_AT.y - 30 },
      { x: x + 30, y: GEM_AT.y + 30 },
      { x: x - 30, y: GEM_AT.y + 30 },
    ];
    const around = add(
      factory.create('capture-point', 'cathedral-capture-point', {
        position: GEM_AT,
        team: 'neutral',
        area: [square(GEM_AT.x)],
      }),
    );
    const elsewhere = add(
      factory.create('capture-point', 'capture-point', {
        position: { x: 500, y: GEM_AT.y },
        team: 'neutral',
        area: [square(500)],
      }),
    );
    const holder = () => gem.getComponent(CathedralGemState).holder;

    expect(holder()).toBe('neutral');
    state.events.emit('capture-point-owner-changed', {
      pointId: elsewhere.id,
      from: 'neutral',
      to: 'dark',
    });
    tick();
    expect(holder()).toBe('neutral');
    state.events.emit('capture-point-owner-changed', {
      pointId: around.id,
      from: 'neutral',
      to: 'light',
    });
    tick();
    expect(holder()).toBe('light');
  });

  it('burns a neutral hitter too: friendly fire never blocks the gem (DEC-292)', () => {
    const { state, gem, warrior, fullTick } = setUp();
    const neutral = warrior(FAR, 'neutral');
    const health = neutral.getComponent(Health);
    const full = health.current;

    new DamagePipeline().apply(state, gem.id, 45, { ...SWORD, attackerId: neutral.id });
    for (let at = 0; at < 2 * TICK_RATE; at += 1) fullTick();

    expect(health.current).toBe(full - 72);
  });

  it('refuses a glow status that never runs out', () => {
    const state = new GameState(createDefaultGameConfig(), 1);
    const loaded = loadStatusEffects(TICK_RATE, 2);
    const glow = { ...CATHEDRAL_GEM, glow: { statusId: 'enraged', extraTicks: 5 } };

    expect(
      () => new CathedralGemSystem(state, new StatusEffectApplier(loaded), loaded, glow),
    ).toThrow('must have a duration');
  });

  it('refuses an unknown status id at match start, before any hit', () => {
    const gem = { ...CATHEDRAL_GEM, statusIds: ['gem-shock', 'no-such-status'] };
    const state = new GameState(createDefaultGameConfig(), 1);
    const loaded = loadStatusEffects(TICK_RATE, 2);

    expect(
      () => new CathedralGemSystem(state, new StatusEffectApplier(loaded), loaded, gem),
    ).toThrow('no-such-status');
  });
});
