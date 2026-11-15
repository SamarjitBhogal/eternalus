import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../combat/DamagePipeline';
import { Health } from '../components/Health';
import { StrikeCooldown } from '../components/StrikeCooldown';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import type { CathedralGemStrike } from '../content/structures/cathedralGemStrike.types';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { TEST_DEBUG_CONFIG } from '../diagnostics/InvariantRunner.constants';
import { MemoryLogger } from '../diagnostics/MemoryLogger';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { MapGenerator } from '../map/MapGenerator';
import { Simulation } from '../Simulation';
import type { DamageSource } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import { IdGenerator } from '../utils/IdGenerator';
import { CathedralGemSystem } from './CathedralGemSystem';

const CONFIG = createDefaultGameConfig();
const logger = new NullLogger();
/** Test numbers, not the TUNE content: 1 s cooldown, 10 units of range. */
const STRIKE: CathedralGemStrike = {
  damage: 7,
  damageType: 'magical',
  cooldownSeconds: 1,
  range: 10,
};

/** The gem at the origin, a neutral camp 1 unit away, light dummies 2 and 100 units away. */
const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const registry = createDefaultEntityRegistry();
  const structures = new EntityFactory(registry, STRUCTURE_DEFINITIONS, new IdGenerator(1000));
  const gem = structures.create('cathedral', 'cathedral', {
    position: { x: 0, y: 0 },
    team: 'neutral',
  });
  const units = new EntityFactory(registry, loadDefaultContent(CONFIG.tickRate));
  const near = units.create('light-mob', 'training-dummy', {
    position: { x: 2, y: 0 },
    team: 'light',
  });
  const far = units.create('light-mob', 'training-dummy', {
    position: { x: 100, y: 0 },
    team: 'light',
  });
  // Unbreakable like the gem but not the gem, so a hit on it is blocked too.
  const beside = structures.create('camp', 'forest-camp-light', {
    position: { x: -1, y: 0 },
    team: 'neutral',
  });
  for (const entity of [gem, near, far, beside]) state.entities.add(entity);
  const damage = new DamagePipeline();
  const system = new CathedralGemSystem(state, damage, STRIKE);
  const struck: string[] = [];
  state.events.on('structure-struck', ({ structureId, targetId }) => {
    expect(structureId).toBe(gem.id);
    struck.push(targetId);
  });
  const sword = (attackerId: string): DamageSource => ({
    attackerId,
    kind: 'weapon',
    definitionId: 'sword',
  });
  /** One tick: `hits` land, then the system updates. */
  const tick = (hits: readonly (readonly [string, DamageSource])[]) => {
    for (const [targetId, source] of hits) damage.apply(state, targetId, 10, source);
    system.update({ state, logger });
    state.advanceTick();
  };
  return { state, gem, near, far, beside, struck, sword, tick };
};

describe('CathedralGemSystem (DISC-11)', () => {
  it('strikes the attacker that hit the gem, once per cooldown, through the damage pipeline', () => {
    const { gem, near, struck, sword, tick } = setUp();
    const before = near.getComponent(Health).current;

    // Hit the gem every tick for two cooldowns and a bit.
    for (let at = 0; at <= 2 * CONFIG.tickRate + 1; at += 1) tick([[gem.id, sword(near.id)]]);

    expect(struck).toEqual([near.id, near.id, near.id]);
    expect(near.getComponent(Health).current).toBe(before - 3 * STRIKE.damage);
  });

  it('does nothing to an attacker out of range', () => {
    const { gem, far, struck, sword, tick } = setUp();
    const before = far.getComponent(Health).current;

    tick([[gem.id, sword(far.id)]]);

    expect(struck).toEqual([]);
    expect(far.getComponent(Health).current).toBe(before);
  });

  it('ignores splash next to the gem and damage over time on it', () => {
    const { gem, near, beside, struck, tick } = setUp();

    // Splash from an attacker in range: the hit names an unbreakable camp beside the gem, not the
    // gem, so it is blocked as a hit on the gem would be, yet nothing strikes back.
    tick([[beside.id, { attackerId: near.id, kind: 'ability', definitionId: 'slam' }]]);
    // Damage over time on the gem is not a direct hit.
    tick([[gem.id, { attackerId: near.id, kind: 'status', definitionId: 'bleed' }]]);

    expect(struck).toEqual([]);
  });

  it('ignores hits with no attacker or from a structure, so two strikers never trade strikes', () => {
    const { gem, near, struck, tick } = setUp();

    tick([[gem.id, { attackerId: null, kind: 'environment', definitionId: 'collapse' }]]);
    tick([[gem.id, { attackerId: near.id, kind: 'structure', definitionId: 'cathedral' }]]);

    expect(struck).toEqual([]);
  });

  it('does not strike an attacker already dead this tick, nor spend the cooldown on it', () => {
    const { gem, near, struck, sword, tick } = setUp();
    const health = near.getComponent(Health);
    health.applyDamage(health.total);

    tick([[gem.id, sword(near.id)]]);

    expect(struck).toEqual([]);
    expect(gem.findComponent(StrikeCooldown)).toBeUndefined();
  });

  it('spends no cooldown on a strike that is blocked (the attacker is an unbreakable camp)', () => {
    const { gem, beside, struck, sword, tick } = setUp();

    tick([[gem.id, sword(beside.id)]]);

    expect(struck).toEqual([]);
    expect(gem.findComponent(StrikeCooldown)).toBeUndefined();
  });

  it('strikes a Legend attacking the gem in a match, the same way twice', () => {
    const run = () => {
      const config = createDefaultGameConfig({ match: { countdownSeconds: 0 } });
      const map = new MapGenerator().generate(config, 1);
      const simulation = new Simulation({
        config,
        seed: 1,
        logger: new MemoryLogger(),
        debug: TEST_DEBUG_CONFIG,
        map,
      });
      const feature = map.features.find(({ definitionId }) => definitionId === 'cathedral');
      const gem = simulation.snapshot().entities.find(({ kind }) => kind === 'cathedral');
      if (feature === undefined || gem === undefined) throw new Error('No Cathedral');
      simulation.enqueueCommand({
        type: 'dev-spawn',
        kind: 'warrior',
        definitionId: 'warrior',
        team: 'light',
        at: { x: feature.position.x - 6, y: feature.position.y },
        count: 1,
      });
      simulation.step();
      const warrior = simulation.snapshot().entities.find(({ kind }) => kind === 'warrior');
      if (warrior === undefined) throw new Error('No warrior');
      const struck: string[] = [];
      simulation.on('structure-struck', ({ targetId }) => struck.push(targetId));
      simulation.enqueueCommand({ type: 'attack-target', actorId: warrior.id, targetId: gem.id });

      for (let at = 0; at < 10 * config.tickRate; at += 1) simulation.step();

      expect(struck.length).toBeGreaterThan(1);
      expect(struck.every((id) => id === warrior.id)).toBe(true);
      const after = simulation.snapshot().entities.find(({ id }) => id === warrior.id);
      expect(after?.health?.current ?? 0).toBeLessThan(warrior.health?.current ?? 0);
      return simulation.hash();
    };

    expect(run()).toBe(run());
  });
});
