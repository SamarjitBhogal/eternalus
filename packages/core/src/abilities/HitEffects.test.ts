import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../combat/DamagePipeline';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { Movement } from '../components/Movement';
import { loadAbilities } from '../content/abilities/loadAbilities';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { loadTurrets } from '../content/structures/loadTurrets';
import type { Entity } from '../entities/Entity';
import type { GameEventMap } from '../state/GameEvents.types';
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
  return { state, caster, struck, neighbour, applied, hits };
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

  it('runs nothing when the struck body is gone', () => {
    const { state, caster, struck, applied, hits } = setUp('fury');
    state.entities.remove(struck.id, 'died');

    hits.afterHit(state, caster.id, struck.id);

    expect(applied).toEqual([]);
  });
});
