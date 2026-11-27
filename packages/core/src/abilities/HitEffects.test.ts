import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../combat/DamagePipeline';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { StatusEffects } from '../components/StatusEffects';
import { loadAbilities } from '../content/abilities/loadAbilities';
import { FURY } from '../content/status-effects/fury';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { STATUS_EFFECTS } from '../content/status-effects/statusEffectCatalogue';
import type { Entity } from '../entities/Entity';
import type { GameEventMap } from '../state/GameEvents.types';
import { casterState } from './__fixtures__/casterState';
import { createDefaultAbilityRegistry } from './defaultAbilityRegistry';
import { HitEffects } from './HitEffects';

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
  it('deals an onHit damage step’s plain amount for an Erudition holder (DEC-337)', () => {
    const catalogue = loadStatusEffects(30, 2, [
      ...STATUS_EFFECTS.all(),
      {
        ...FURY,
        id: 'searing',
        modifiers: [],
        onHit: [{ kind: 'damage', amount: 10, damageType: 'physical', shape: { kind: 'hit' } }],
      },
    ]);
    /** The health the struck body loses to one hit by an attacker with `statusIds`. */
    const lossWith = (statusIds: readonly string[]): number => {
      const { state, factory, caster } = casterState();
      const struck = factory.create('warrior', 'warrior', {
        position: { x: 0, y: 1 },
        team: 'dark',
      });
      state.entities.add(struck);
      const statuses = new StatusEffectApplier(catalogue);
      for (const statusId of statusIds) {
        statuses.apply(state, caster.id, statusId, caster.id);
      }
      const health = struck.getComponent(Health);
      const before = health.current;
      new HitEffects(REGISTRY, new DamagePipeline(), statuses).afterHit(
        state,
        caster.id,
        struck.id,
      );
      return before - health.current;
    };

    expect(lossWith(['searing'])).toBeGreaterThan(0);
    expect(lossWith(['searing', 'erudition'])).toBe(lossWith(['searing']));
  });

  it('keeps an onHit knock-back’s stagger time for an Erudition holder (DEC-337 (3))', () => {
    /** The ticks the struck body stays staggered after one hit by an attacker with `statusIds`. */
    const staggerWith = (statusIds: readonly string[]): number | null | undefined => {
      const { state, factory, caster } = casterState();
      const struck = factory.create('warrior', 'warrior', {
        position: { x: 0, y: 1 },
        team: 'dark',
      });
      state.entities.add(struck);
      const statuses = new StatusEffectApplier(STATUSES);
      for (const statusId of statusIds) {
        statuses.apply(state, caster.id, statusId, caster.id);
      }
      new HitEffects(REGISTRY, new DamagePipeline(), statuses).afterHit(
        state,
        caster.id,
        struck.id,
      );
      const expires = struck
        .getComponent(StatusEffects)
        .active.find(({ definition }) => definition.id === 'staggered')?.expiresTick;
      return expires === undefined || expires === null ? expires : expires - state.tick;
    };

    expect(staggerWith(['fury'])).toBeGreaterThan(0);
    expect(staggerWith(['fury', 'erudition'])).toBe(staggerWith(['fury']));
  });
});
