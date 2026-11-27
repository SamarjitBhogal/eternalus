import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../combat/DamagePipeline';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import { loadAbilities } from '../content/abilities/loadAbilities';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { loadTurrets } from '../content/structures/loadTurrets';
import type { UnitAttack } from '../content/units/units.types';
import type { Entity } from '../entities/Entity';
import type { GameEventMap } from '../state/GameEvents.types';
import type { Shooter } from '../state/HitRunner.types';
import { casterState } from './__fixtures__/casterState';
import { createDefaultAbilityRegistry } from './defaultAbilityRegistry';
import { HitEffects } from './HitEffects';

const STATUSES = loadStatusEffects(30, 2);
const REGISTRY = createDefaultAbilityRegistry(loadAbilities(30), 30);
const AMMO = loadTurrets(30).ammo;
/** A heavy bolt's attack: its onHit steps put `concussion` on the struck body. */
const HEAVY_BOLT = AMMO.get('bolt-heavy').attack;
/** A default bolt's attack: no onHit steps. */
const DEFAULT_BOLT = AMMO.get('bolt-default').attack;

/** A light Vanguard at the origin, a dark Vanguard it struck 1 m north, and one beside that. */
const setUp = (statusId: string) => {
  const { state, factory, caster } = casterState();
  const enemyAt = (x: number, y: number): Entity => {
    const enemy = factory.create('warrior', 'warrior', { position: { x, y }, team: 'dark' });
    state.entities.add(enemy);
    return enemy;
  };
  const struck = enemyAt(0, 1);
  const neighbour = enemyAt(0, 1.5);
  const statuses = new StatusEffectApplier(STATUSES);
  statuses.apply(state, caster.id, statusId, caster.id);
  const applied: GameEventMap['status-applied'][] = [];
  state.events.on('status-applied', (payload) => applied.push(payload));
  const hits = new HitEffects(REGISTRY, new DamagePipeline(), statuses);
  return { state, factory, caster, struck, neighbour, applied, hits };
};

/** A light shot's owner as it fired from the origin, under the heavy bolt's name. */
const SHOOTER: Shooter = {
  team: 'light',
  ownerLevel: 1,
  origin: { x: 0, y: 0 },
  source: { definitionId: 'turret' },
};

/** A heavy bolt whose onHit step concusses everyone in a 3 m circle around the struck body. */
const AREA_BOLT: UnitAttack = {
  ...HEAVY_BOLT,
  onHit: [
    {
      kind: 'debuff',
      statusId: 'concussion',
      durationTicks: 45,
      shape: { kind: 'circle', radius: 3 },
    },
  ],
};

/** A heavy bolt whose onHit step dashes the owner 4 m and damages around where it ends. */
const DASH_BOLT: UnitAttack = {
  ...HEAVY_BOLT,
  onHit: [
    {
      kind: 'dash',
      distance: 4,
      durationTicks: 4,
      onPath: [],
      onEnd: [
        {
          kind: 'damage',
          amount: 40,
          damageType: 'physical',
          shape: { kind: 'circle', radius: 3 },
        },
      ],
    },
  ],
};

/** Where the pushes under way will have moved `entity`, in all. */
const pushOf = (entity: Entity) =>
  entity
    .getComponent(Movement)
    .forcedPushes.reduce(
      (sum, push) => ({ x: sum.x + push.x * push.ticksLeft, y: sum.y + push.y * push.ticksLeft }),
      { x: 0, y: 0 },
    );

describe('HitEffects', () => {
  it('runs the attacker’s onHit steps on the struck body only, credited to the attacker', () => {
    const { state, caster, struck, neighbour, applied, hits } = setUp('fury');

    hits.afterHit(state, caster.id, struck.id);

    expect(applied).toEqual([{ entityId: struck.id, statusId: 'staggered', sourceId: caster.id }]);
    expect(pushOf(struck).x).toBeCloseTo(0);
    expect(pushOf(struck).y).toBeCloseTo(1);
    expect(pushOf(neighbour)).toEqual({ x: 0, y: 0 });
  });

  it("runs the attack's own onHit steps first, then the attacker's statuses' (05 §10)", () => {
    const { state, caster, struck, neighbour, applied, hits } = setUp('fury');

    hits.afterHit(state, caster.id, struck.id, HEAVY_BOLT);

    expect(applied).toEqual([
      { entityId: struck.id, statusId: 'concussion', sourceId: caster.id },
      { entityId: struck.id, statusId: 'staggered', sourceId: caster.id },
    ]);
    expect(pushOf(struck).y).toBeCloseTo(1);
    expect(pushOf(neighbour)).toEqual({ x: 0, y: 0 });
  });

  it("runs the attack's onHit steps for an attacker whose statuses have none", () => {
    const { state, caster, struck, applied, hits } = setUp('rallied');

    hits.afterHit(state, caster.id, struck.id, HEAVY_BOLT);

    expect(applied).toEqual([{ entityId: struck.id, statusId: 'concussion', sourceId: caster.id }]);
  });

  it('runs nothing for an attack and statuses with no onHit steps', () => {
    const { state, caster, struck, applied, hits } = setUp('rallied');

    hits.afterHit(state, caster.id, struck.id);
    hits.afterHit(state, caster.id, struck.id, DEFAULT_BOLT);

    expect(applied).toEqual([]);
    expect(pushOf(struck)).toEqual({ x: 0, y: 0 });
  });

  it("runs only the statuses' steps for an attack with no onHit steps", () => {
    const { state, caster, struck, applied, hits } = setUp('fury');

    hits.afterHit(state, caster.id, struck.id, DEFAULT_BOLT);

    expect(applied).toEqual([{ entityId: struck.id, statusId: 'staggered', sourceId: caster.id }]);
  });

  it("runs the attack's area step for a shot whose owner is gone: it hits the owner's enemies, not its allies (S4)", () => {
    const { state, caster, struck, neighbour, applied, hits, factory } = setUp('rallied');
    const ally = factory.create('warrior', 'warrior', { position: { x: 1, y: 0 }, team: 'light' });
    state.entities.add(ally);
    state.entities.remove(caster.id, 'died');
    applied.length = 0;

    hits.afterHit(state, caster.id, struck.id, AREA_BOLT, SHOOTER);

    expect(applied).toEqual([
      { entityId: struck.id, statusId: 'concussion', sourceId: caster.id },
      { entityId: neighbour.id, statusId: 'concussion', sourceId: caster.id },
    ]);
  });

  it('does nothing for a dash in the onHit of a shot whose owner is gone, and does not throw (S4)', () => {
    const { state, caster, struck, neighbour, hits } = setUp('rallied');
    const damaged: string[] = [];
    state.events.on('damage-applied', ({ targetId }) => damaged.push(targetId));
    state.entities.remove(caster.id, 'died');

    expect(() => {
      hits.afterHit(state, caster.id, struck.id, DASH_BOLT, SHOOTER);
    }).not.toThrow();
    expect(damaged).toEqual([]);
    expect(pushOf(struck)).toEqual({ x: 0, y: 0 });
    expect(pushOf(neighbour)).toEqual({ x: 0, y: 0 });
  });

  it('runs nothing when the struck body is gone', () => {
    const { state, caster, struck, applied, hits } = setUp('fury');
    state.entities.remove(struck.id, 'died');

    hits.afterHit(state, caster.id, struck.id);

    expect(applied).toEqual([]);
  });

  it('runs nothing for an attacker that is gone when no shooter is given (critic r3 N1)', () => {
    const { state, caster, struck, applied, hits } = setUp('rallied');
    state.entities.remove(caster.id, 'died');
    applied.length = 0;

    hits.afterHit(state, caster.id, struck.id, HEAVY_BOLT);

    expect(applied).toEqual([]);
  });

  it('runs nothing for an attacker in the store that has no position (critic r3 N1)', () => {
    const { state, caster, struck, applied, hits } = setUp('rallied');
    caster.removeComponent(Transform);
    applied.length = 0;

    hits.afterHit(state, caster.id, struck.id, HEAVY_BOLT, SHOOTER);

    expect(applied).toEqual([]);
  });
});
