import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { BODY_PART_BONUS } from '../content/mobs/bodyPartBonus';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { GameState } from '../state/GameState';
import type { Vec2 } from '../utils/geometry.types';
import { BodyPartBonusStep } from './BodyPartBonusStep';
import { DamagePipeline } from './DamagePipeline';
import type { DamageHit } from './DamageStep.types';

/** The Greater Boss's head and an off-head body point, local to its left-facing pose (greaterBoss.ts). */
const HEAD = { x: -7, y: -10 };
const BODY = { x: -15, y: 0 };

/**
 * The Greater Boss at the origin facing `facing`, a heavy guard (no outline) at (100, 0) facing
 * east, and a dark Warrior; `standAt` moves the Warrior.
 */
const setUp = (facing: Vec2 = { x: -1, y: 0 }) => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(30),
    undefined,
    loadWeapons(30),
  );
  const add = (kind: string, id: string, team: 'dark' | 'neutral', position: Vec2) => {
    const entity = factory.create(kind, id, { team, position });
    state.entities.add(entity);
    return entity;
  };
  const boss = add('heavy-mob', 'greater-boss', 'neutral', { x: 0, y: 0 });
  boss.getComponent(Transform).face(facing);
  const guard = add('heavy-mob', 'heavy-guard', 'neutral', { x: 100, y: 0 });
  const legend = add('warrior', 'warrior', 'dark', { x: -30, y: 0 });
  const standAt = (point: Vec2): void => {
    legend.getComponent(Transform).moveTo(point);
  };
  return { state, boss: boss.id, guard: guard.id, legend: legend.id, standAt };
};

/** A 100-damage weapon hit from `attackerId`, with an impact point when it is a projectile's. */
const hit = (attackerId: string | null, targetId: string, impactPoint?: Vec2): DamageHit => ({
  targetId,
  amount: 100,
  source: { attackerId, kind: 'weapon', definitionId: 'x' },
  ...(impactPoint !== undefined && { impactPoint }),
});

describe('BodyPartBonusStep', () => {
  const step = new BodyPartBonusStep(BODY_PART_BONUS);

  it('adds the back-hit bonus to a hit from the rear half, and none from the front half', () => {
    const { state, boss, legend, standAt } = setUp();

    standAt({ x: 30, y: 0 });
    expect(step.adjust(hit(legend, boss), state)).toBeCloseTo(100 * BODY_PART_BONUS.backHit);
    standAt({ x: 1, y: 30 });
    expect(step.adjust(hit(legend, boss), state)).toBeCloseTo(100 * BODY_PART_BONUS.backHit);
    standAt({ x: -30, y: 0 });
    expect(step.adjust(hit(legend, boss), state)).toBe(100);
    standAt({ x: 0, y: 30 });
    expect(step.adjust(hit(legend, boss), state)).toBe(100);
    expect(step.adjust(hit(null, boss), state)).toBe(100);
  });

  it('finds behind on the side the art shows its back, also when the boss walks up or down', () => {
    const { state, boss, legend, standAt } = setUp({ x: 0, y: 1 });

    standAt({ x: 30, y: 0 });
    expect(step.adjust(hit(legend, boss), state)).toBeCloseTo(100 * BODY_PART_BONUS.backHit);
    standAt({ x: 0, y: -30 });
    expect(step.adjust(hit(legend, boss), state)).toBe(100);
  });

  it('gives a status tick no back-hit bonus, as a tick is no hit from a side', () => {
    const { state, boss, legend, standAt } = setUp();
    standAt({ x: 30, y: 0 });
    const tick: DamageHit = {
      targetId: boss,
      amount: 100,
      source: { attackerId: legend, kind: 'status', definitionId: 'bleed' },
    };

    expect(step.adjust(tick, state)).toBe(100);
  });

  it('adds the head-shot bonus to a projectile that lands on the head outline, not on the body', () => {
    const { state, boss, legend } = setUp();

    expect(step.adjust(hit(legend, boss, HEAD), state)).toBeCloseTo(100 * BODY_PART_BONUS.headShot);
    expect(step.adjust(hit(legend, boss, BODY), state)).toBe(100);
    expect(step.adjust(hit(null, boss, HEAD), state)).toBeCloseTo(100 * BODY_PART_BONUS.headShot);
  });

  it('gives a projectile on the body from behind the back-hit bonus only', () => {
    const { state, boss, legend, standAt } = setUp();
    standAt({ x: 30, y: 0 });

    expect(step.adjust(hit(legend, boss, BODY), state)).toBeCloseTo(100 * BODY_PART_BONUS.backHit);
  });

  it('gives a melee hit no head-shot bonus, even from an attacker in the head area', () => {
    const { state, boss, legend, standAt } = setUp();
    standAt(HEAD);

    expect(step.adjust(hit(legend, boss), state)).toBe(100);
  });

  it('finds the head on the side the boss faces, as the art is mirrored', () => {
    const { state, boss, legend, standAt } = setUp({ x: 1, y: 0 });
    standAt({ x: 30, y: 0 });
    const mirrored = { x: -HEAD.x, y: HEAD.y };

    expect(step.adjust(hit(legend, boss, mirrored), state)).toBeCloseTo(
      100 * BODY_PART_BONUS.headShot,
    );
    expect(step.adjust(hit(legend, boss, HEAD), state)).toBe(100);
  });

  it('applies only the larger bonus when both hold', () => {
    const { state, boss, legend, standAt } = setUp();
    standAt({ x: 30, y: 0 });
    const backLarger = new BodyPartBonusStep({ backHit: 1.5, headShot: 1.2 });

    expect(step.adjust(hit(legend, boss, HEAD), state)).toBeCloseTo(
      100 * Math.max(BODY_PART_BONUS.backHit, BODY_PART_BONUS.headShot),
    );
    expect(backLarger.adjust(hit(legend, boss, HEAD), state)).toBeCloseTo(150);
  });

  it('never changes a hit on a unit without a body outline', () => {
    const { state, guard, legend, standAt } = setUp();
    standAt({ x: 90, y: 0 });

    expect(step.adjust(hit(legend, guard, { x: 100, y: 0 }), state)).toBe(100);
    expect(step.adjust(hit(legend, 'nobody'), state)).toBe(100);
  });

  it('runs in the default pipeline, which passes the impact point on to it', () => {
    const { state, boss, legend, standAt } = setUp();
    const pipeline = new DamagePipeline();
    const health = state.entities.get(boss)?.getComponent(Health);
    const lost = (deal: () => void): number => {
      const before = health?.current ?? 0;
      deal();
      return before - (health?.current ?? 0);
    };
    const { source } = hit(legend, boss);

    expect(lost(() => pipeline.apply(state, boss, 100, source, HEAD))).toBeCloseTo(
      100 * BODY_PART_BONUS.headShot,
    );
    standAt({ x: 30, y: 0 });
    expect(lost(() => pipeline.apply(state, boss, 100, source))).toBeCloseTo(
      100 * BODY_PART_BONUS.backHit,
    );
  });

  it.each([
    [{ backHit: 0.9, headShot: 1.25 }, /'backHit' needs a finite multiplier of at least 1/],
    [{ backHit: 1.15, headShot: Number.NaN }, /'headShot' needs a finite multiplier/],
  ])('rejects a bonus that is not a finite multiplier of at least 1 (%o)', (bonus, message) => {
    expect(() => new BodyPartBonusStep(bonus)).toThrow(message);
  });
});
