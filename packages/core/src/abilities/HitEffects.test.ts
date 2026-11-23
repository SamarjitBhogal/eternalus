import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../combat/DamagePipeline';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { Movement } from '../components/Movement';
import { loadAbilities } from '../content/abilities/loadAbilities';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import type { Entity } from '../entities/Entity';
import type { GameEventMap } from '../state/GameEvents.types';
import { casterState } from './__fixtures__/casterState';
import { createDefaultAbilityRegistry } from './defaultAbilityRegistry';
import { HitEffects } from './HitEffects';
import { AreaHitQuery } from '../state/AreaHitQuery';

const STATUSES = loadStatusEffects(30, 2);
const REGISTRY = createDefaultAbilityRegistry(loadAbilities(30), 30);

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
  const hits = new HitEffects(REGISTRY, new DamagePipeline(), statuses, new AreaHitQuery());
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

  it('runs nothing for an attacker whose statuses have no onHit steps', () => {
    const { state, caster, struck, applied, hits } = setUp('rallied');

    hits.afterHit(state, caster.id, struck.id);

    expect(applied).toEqual([]);
    expect(pushOf(struck)).toEqual({ x: 0, y: 0 });
  });

  it('runs nothing when the struck body is gone', () => {
    const { state, caster, struck, applied, hits } = setUp('fury');
    state.entities.remove(struck.id, 'died');

    hits.afterHit(state, caster.id, struck.id);

    expect(applied).toEqual([]);
  });
});
