import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { BODY_PART_BONUS } from '../content/mobs/bodyPartBonus';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { MeleeAttackStrategy } from '../entities/strategies/MeleeAttackStrategy';
import { GameState } from '../state/GameState';
import type { Vec2 } from '../utils/geometry.types';
import { BodyPartBonusStep } from './BodyPartBonusStep';
import { DamagePipeline } from './DamagePipeline';
import type { DamageHit, HitPath } from './DamageStep.types';

/** The Greater Boss's head and an off-head body point, local to its left-facing pose (greaterBoss.ts). */
const HEAD = { x: -7, y: -10 };
const BODY = { x: -15, y: 0 };
/** Behind and in front of the boss at the origin when it faces left. */
const BACK = { x: 30, y: 0 };
const FRONT = { x: -30, y: 0 };

/**
 * The Greater Boss at the origin facing `facing`, a heavy guard (no outline) at (100, 0) facing
 * east, and a dark Warrior in front of the boss; `standAt` moves the Warrior.
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
  const legend = add('warrior', 'warrior', 'dark', FRONT);
  const standAt = (point: Vec2): void => {
    legend.getComponent(Transform).moveTo(point);
  };
  return { state, boss: boss.id, guard: guard.id, legend, standAt };
};

/** A 100-damage weapon hit by `attackerId` on `targetId` along `path`; no path is a hit from no side. */
const hit = (targetId: string, path?: HitPath, attackerId: string | null = null): DamageHit => ({
  targetId,
  amount: 100,
  source: { attackerId, kind: 'weapon', definitionId: 'x' },
  ...(path === undefined ? {} : { path }),
});

/** A shot from `origin` along the x axis at height `y` that strikes the boss's 40 m body at its edge. */
const shotAcross = (origin: Vec2): HitPath => ({
  origin,
  impactPoint: { x: Math.sign(origin.x) * 20.5, y: origin.y },
});

describe('BodyPartBonusStep', () => {
  const step = new BodyPartBonusStep(BODY_PART_BONUS);

  it('adds the back-hit bonus in the 120-degree zone behind (DEC-381 (2) B), and none outside it', () => {
    const { state, boss } = setUp();
    const from = (origin: Vec2): number => step.adjust(hit(boss, { origin }), state);

    expect(from(BACK)).toBeCloseTo(100 * BODY_PART_BONUS.backHit);
    // 59 degrees off the back is in the zone; 60.5 degrees and the side are out of it.
    expect(from({ x: 30, y: 50 })).toBeCloseTo(100 * BODY_PART_BONUS.backHit);
    expect(from({ x: 30, y: 53 })).toBe(100);
    expect(from({ x: 1, y: 30 })).toBe(100);
    expect(from(FRONT)).toBe(100);
    expect(from({ x: 0, y: 30 })).toBe(100);
  });

  it('finds behind on the side the art shows its back, also when the boss walks up or down', () => {
    const { state, boss } = setUp({ x: 0, y: 1 });

    expect(step.adjust(hit(boss, { origin: BACK }), state)).toBeCloseTo(
      100 * BODY_PART_BONUS.backHit,
    );
    expect(step.adjust(hit(boss, { origin: { x: 0, y: -30 } }), state)).toBe(100);
  });

  it('reads the width of the zone behind from content: 180 degrees is the whole rear half', () => {
    const { state, boss } = setUp();
    const rearHalf = new BodyPartBonusStep({ ...BODY_PART_BONUS, backZoneDegrees: 180 });

    expect(rearHalf.adjust(hit(boss, { origin: { x: 1, y: 30 } }), state)).toBeCloseTo(
      100 * BODY_PART_BONUS.backHit,
    );
  });

  it('reads behind from where the hit came from, not from where its attacker stands now', () => {
    const { state, boss, legend, standAt } = setUp();
    standAt(FRONT);

    expect(step.adjust(hit(boss, shotAcross(BACK), legend.id), state)).toBeCloseTo(
      100 * BODY_PART_BONUS.backHit,
    );
    standAt(BACK);
    expect(step.adjust(hit(boss, shotAcross(FRONT), legend.id), state)).toBe(100);
  });

  it('gives a hit from no side no bonus: a bleed or burn tick (DEC-381 (7) A), a blast, a collapse', () => {
    const { state, boss, legend, standAt } = setUp();
    standAt(BACK);

    expect(step.adjust(hit(boss, undefined, legend.id), state)).toBe(100);
  });

  it('adds the head-shot bonus when the line of flight crosses the head, from any side (HC-B60 A)', () => {
    const { state, boss } = setUp();
    const at = (path: HitPath): number => step.adjust(hit(boss, path), state);

    expect(at(shotAcross({ x: -40, y: HEAD.y }))).toBeCloseTo(100 * BODY_PART_BONUS.headShot);
    expect(at({ origin: { x: HEAD.x, y: 40 }, impactPoint: { x: HEAD.x, y: 8.5 } })).toBeCloseTo(
      100 * BODY_PART_BONUS.headShot,
    );
    expect(at({ origin: { x: HEAD.x, y: -40 }, impactPoint: { x: HEAD.x, y: -18.5 } })).toBeCloseTo(
      100 * BODY_PART_BONUS.headShot,
    );
    expect(at(shotAcross(FRONT))).toBe(100);
    expect(at({ origin: { x: 0, y: 40 }, impactPoint: { x: 0, y: 8.5 } })).toBe(100);
  });

  it('adds the head-shot bonus to a shot that lands on the head, but never to a melee hit', () => {
    const { state, boss } = setUp();

    expect(step.adjust(hit(boss, { origin: HEAD, impactPoint: HEAD }), state)).toBeCloseTo(
      100 * BODY_PART_BONUS.headShot,
    );
    expect(step.adjust(hit(boss, { origin: FRONT, impactPoint: BODY }), state)).toBe(100);
    expect(step.adjust(hit(boss, { origin: HEAD }), state)).toBe(100);
  });

  it('gives a shot on the body from behind the back-hit bonus only', () => {
    const { state, boss } = setUp();

    expect(step.adjust(hit(boss, shotAcross(BACK)), state)).toBeCloseTo(
      100 * BODY_PART_BONUS.backHit,
    );
  });

  it('finds the head on the side the boss faces, as the art is mirrored', () => {
    const { state, boss } = setUp({ x: 1, y: 0 });
    const mirrored = { x: -HEAD.x, y: HEAD.y };

    expect(step.adjust(hit(boss, shotAcross({ x: 40, y: mirrored.y })), state)).toBeCloseTo(
      100 * BODY_PART_BONUS.headShot,
    );
    expect(
      step.adjust(
        hit(boss, { origin: { x: HEAD.x, y: 40 }, impactPoint: { x: HEAD.x, y: 8.5 } }),
        state,
      ),
    ).toBe(100);
  });

  it('applies only the larger bonus when both hold', () => {
    const { state, boss } = setUp();
    const fromBehindThroughHead = shotAcross({ x: 40, y: HEAD.y });
    const backLarger = new BodyPartBonusStep({ backHit: 1.5, headShot: 1.2, backZoneDegrees: 120 });

    expect(step.adjust(hit(boss, fromBehindThroughHead), state)).toBeCloseTo(
      100 * Math.max(BODY_PART_BONUS.backHit, BODY_PART_BONUS.headShot),
    );
    expect(backLarger.adjust(hit(boss, fromBehindThroughHead), state)).toBeCloseTo(150);
  });

  it('never changes a hit on a unit without a body outline', () => {
    const { state, guard } = setUp();

    expect(
      step.adjust(hit(guard, { origin: { x: 90, y: 0 }, impactPoint: { x: 100, y: 0 } }), state),
    ).toBe(100);
    expect(step.adjust(hit('nobody', { origin: BACK }), state)).toBe(100);
  });

  it('runs in the default pipeline, which passes the path on; melee sends its attacker’s position', () => {
    const { state, boss, legend, standAt } = setUp();
    const pipeline = new DamagePipeline();
    const health = state.entities.get(boss)?.getComponent(Health);
    const lost = (deal: () => void): number => {
      const before = health?.current ?? 0;
      deal();
      return before - (health?.current ?? 0);
    };
    const source = { attackerId: legend.id, kind: 'weapon', definitionId: 'x' } as const;
    const melee = { strategy: 'melee', damage: 100, reach: 1.5, interval: 30 } as const;

    expect(
      lost(() => pipeline.apply(state, boss, 100, source, shotAcross({ x: -40, y: HEAD.y }))),
    ).toBeCloseTo(100 * BODY_PART_BONUS.headShot);
    standAt(BACK);
    expect(
      lost(() => {
        new MeleeAttackStrategy().attack(legend, boss, melee, { state, damage: pipeline });
      }),
    ).toBeCloseTo(100 * BODY_PART_BONUS.backHit);
    expect(lost(() => pipeline.apply(state, boss, 100, { ...source, kind: 'status' }))).toBe(100);
  });

  it.each([
    [
      { backHit: 0.9, headShot: 1.25, backZoneDegrees: 120 },
      /'backHit' needs a finite multiplier of at least 1/,
    ],
    [
      { backHit: 1.15, headShot: Number.NaN, backZoneDegrees: 120 },
      /'headShot' needs a finite multiplier/,
    ],
    [{ backHit: 1.15, headShot: 1.25, backZoneDegrees: 0 }, /'backZoneDegrees' needs an angle/],
    [{ backHit: 1.15, headShot: 1.25, backZoneDegrees: 190 }, /'backZoneDegrees' needs an angle/],
    [
      { backHit: 1.15, headShot: 1.25, backZoneDegrees: Number.NaN },
      /'backZoneDegrees' needs an angle/,
    ],
  ])('rejects a multiplier below 1 or a zone outside (0, 180] degrees (%o)', (bonus, message) => {
    expect(() => new BodyPartBonusStep(bonus)).toThrow(message);
  });
});
