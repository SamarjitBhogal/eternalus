import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../combat/DamagePipeline';
import { BossMoveCast } from '../components/BossMoveCast';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { NullLogger } from '../diagnostics/NullLogger';
import { BOSS_MOVES } from '../content/ai/bosses/bossProfiles';
import { GREATER_BOSS_PROFILE } from '../content/ai/bosses/greaterBoss';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { SpaceIndex } from '../physics/SpaceIndex';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { cos, sin } from '../utils/deterministicMath';
import { GameState } from '../state/GameState';
import type { Team } from '../teams/teams.types';
import { BossMoveSystem } from './BossMoveSystem';
import { createDefaultBossMoveEffects } from './defaultBossMoveEffects';

const [SLAM, SWEEP, WIDE_SWEEP, BEAM, CHARGE, ROAR] = GREATER_BOSS_PROFILE.moves;
const BOSS_AT = { x: 50, y: 20 };

/** A boss at `BOSS_AT` with a space index; `add` places units, `land` runs the system. */
const setUp = () => {
  const config = createDefaultGameConfig();
  const space = new SpaceIndex(TWO_LANE_MAP.width, TWO_LANE_MAP.height, 2);
  const state = new GameState(config, 1, matchWorldOf(TWO_LANE_MAP), { space });
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(config.tickRate),
    undefined,
    loadWeapons(config.tickRate),
  );
  const add = (kind: string, definitionId: string, team: Team, dx: number) => {
    const entity = factory.create(kind, definitionId, {
      team,
      position: { x: BOSS_AT.x + dx, y: BOSS_AT.y },
    });
    state.entities.add(entity);
    return entity;
  };
  const boss = add('heavy-mob', 'greater-boss', 'neutral', 0);
  const executed: unknown[] = [];
  state.events.on('boss-move-executed', (payload) => executed.push(payload));
  const system = new BossMoveSystem(
    new DamagePipeline(),
    BOSS_MOVES,
    createDefaultBossMoveEffects(),
  );
  const land = () => {
    space.begin(state.entities.size);
    state.entities.forEach((entity) => {
      const { x, y } = entity.getComponent(Transform).position;
      space.add(entity.id, x, y);
    });
    space.commit();
    system.update({ state, logger: new NullLogger() });
  };
  return { state, boss, add, land, executed };
};

const damageOf = (entity: { getComponent: (type: typeof Health) => Health }): number => {
  const health = entity.getComponent(Health);
  return health.max - health.current;
};

describe('BossMoveSystem', () => {
  it('slams every non-neutral unit inside the radius on the landing tick, and none outside', () => {
    const { state, boss, add, land, executed } = setUp();
    const inside = add('warrior', 'warrior', 'light', SLAM.radius - 0.1);
    const insideDark = add('light-mob', 'training-dummy', 'dark', -(SLAM.radius - 0.1));
    const outside = add('warrior', 'warrior', 'light', -(SLAM.radius + 0.1));
    const neutral = add('light-mob', 'training-dummy', 'neutral', 1);
    state.entities.beginBossMove(boss.id, SLAM.id, 2);

    land();
    state.advanceTick();
    land();
    expect(executed).toEqual([]);
    expect(damageOf(inside)).toBe(0);

    state.advanceTick();
    land();
    expect(executed).toEqual([{ bossId: boss.id, move: SLAM.id }]);
    expect([inside, insideDark, outside, neutral].map(damageOf)).toEqual([
      Math.min(SLAM.damage, inside.getComponent(Health).max),
      Math.min(SLAM.damage, insideDark.getComponent(Health).max),
      0,
      0,
    ]);
    expect(boss.getComponent(BossMoveCast).moveId).toBeNull();
  });

  it('lands once: the next tick hits nothing more', () => {
    const { state, boss, add, land, executed } = setUp();
    const target = add('light-mob', 'training-dummy', 'dark', 1);
    state.entities.beginBossMove(boss.id, SLAM.id, 0);
    land();
    const after = damageOf(target);

    state.advanceTick();
    land();
    expect(executed).toHaveLength(1);
    expect(damageOf(target)).toBe(after);
  });

  it('sweeps the cone in front of the boss: hits and pushes away only the units inside it', () => {
    const { state, boss, add, land, executed } = setUp();
    boss.getComponent(Transform).face({ x: 1, y: 0 });
    const reach = SWEEP.radius - 0.1;
    const edge = ((SWEEP.halfAngleDegrees - 1) * Math.PI) / 180;
    const outside = ((SWEEP.halfAngleDegrees + 1) * Math.PI) / 180;
    const ahead = add('light-mob', 'training-dummy', 'dark', reach);
    const onEdge = add('warrior', 'warrior', 'light', 0);
    onEdge.getComponent(Transform).moveTo({
      x: BOSS_AT.x + reach * cos(edge),
      y: BOSS_AT.y + reach * sin(edge),
    });
    const beside = add('warrior', 'warrior', 'light', 0);
    beside.getComponent(Transform).moveTo({
      x: BOSS_AT.x + reach * cos(outside),
      y: BOSS_AT.y + reach * sin(outside),
    });
    const behind = add('warrior', 'warrior', 'light', -1);
    const tooFar = add('warrior', 'warrior', 'light', SWEEP.radius + 0.1);
    state.entities.beginBossMove(boss.id, SWEEP.id, 0);

    land();
    expect(executed).toEqual([{ bossId: boss.id, move: SWEEP.id }]);
    expect([ahead, onEdge, beside, behind, tooFar].map(damageOf)).toEqual([
      Math.min(SWEEP.damage, ahead.getComponent(Health).max),
      SWEEP.damage,
      0,
      0,
      0,
    ]);
    const push = onEdge.getComponent(Movement).push;
    expect(push.x).toBeCloseTo(SWEEP.knockback * cos(edge), 9);
    expect(push.y).toBeCloseTo(SWEEP.knockback * sin(edge), 9);
    expect([beside, behind, tooFar].map((unit) => unit.getComponent(Movement).push)).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ]);
  });

  it('pushes a unit on the boss centre along the facing', () => {
    const { state, boss, add, land } = setUp();
    boss.getComponent(Transform).face({ x: 0, y: -1 });
    const under = add('warrior', 'warrior', 'light', 0);
    state.entities.beginBossMove(boss.id, SWEEP.id, 0);

    land();
    expect(under.getComponent(Movement).push).toEqual({ x: 0, y: -SWEEP.knockback });
  });

  it('charges along its facing: hits only the units on its path and dashes its length', () => {
    const { state, boss, add, land } = setUp();
    boss.getComponent(Transform).face({ x: 1, y: 0 });
    const onPath = add('warrior', 'warrior', 'light', CHARGE.length - 0.1);
    const nearEdge = add('warrior', 'warrior', 'light', 1);
    nearEdge.getComponent(Transform).moveTo({
      x: BOSS_AT.x + 1,
      y: BOSS_AT.y + CHARGE.width / 2 - 0.1,
    });
    const beside = add('warrior', 'warrior', 'light', 1);
    beside
      .getComponent(Transform)
      .moveTo({ x: BOSS_AT.x + 1, y: BOSS_AT.y + CHARGE.width / 2 + 0.1 });
    const behind = add('warrior', 'warrior', 'light', -1);
    const beyond = add('warrior', 'warrior', 'light', CHARGE.length + 0.1);
    state.entities.beginBossMove(boss.id, CHARGE.id, 0);

    land();
    expect([onPath, nearEdge, beside, behind, beyond].map(damageOf)).toEqual([
      CHARGE.damage,
      CHARGE.damage,
      0,
      0,
      0,
    ]);
    expect(boss.getComponent(Movement).push).toEqual({ x: CHARGE.length, y: 0 });
  });

  it("cuts the charge short at its zone's edge, and hits nothing past it", () => {
    const { state, boss, add, land } = setUp();
    // A zone of radius 4 around the boss's own spot: the dash stops 4 m out.
    state.guards.add({
      id: 'cathedral:0',
      homeId: 'cathedral',
      team: 'neutral',
      mobId: 'greater-boss',
      row: 0,
      indexInRow: 0,
      postX: BOSS_AT.x,
      postY: BOSS_AT.y,
      homeX: BOSS_AT.x,
      homeY: BOSS_AT.y,
      homeRadius: 1,
      leashRadius: 3,
      leashTolerance: 3,
      respawnTicks: 0,
    });
    state.guards.fill(0, boss.id);
    boss.getComponent(Transform).face({ x: 0, y: 1 });
    const inside = add('warrior', 'warrior', 'light', 0);
    inside.getComponent(Transform).moveTo({ x: BOSS_AT.x, y: BOSS_AT.y + 3.9 });
    const past = add('warrior', 'warrior', 'light', 0);
    past.getComponent(Transform).moveTo({ x: BOSS_AT.x, y: BOSS_AT.y + 4.1 });
    state.entities.beginBossMove(boss.id, CHARGE.id, 0);

    land();
    expect([inside, past].map(damageOf)).toEqual([CHARGE.damage, 0]);
    expect(boss.getComponent(Movement).push.x).toBeCloseTo(0, 9);
    expect(boss.getComponent(Movement).push.y).toBeCloseTo(4, 9);
  });

  it('sweeps wider with the second sweep: a unit just inside its half circle is hit', () => {
    const { state, boss, add, land } = setUp();
    expect(WIDE_SWEEP.halfAngleDegrees).toBeGreaterThan(SWEEP.halfAngleDegrees);
    boss.getComponent(Transform).face({ x: 1, y: 0 });
    const reach = WIDE_SWEEP.radius - 0.1;
    // Past the first sweep's cone, inside the wide sweep's.
    const angle = ((SWEEP.halfAngleDegrees + WIDE_SWEEP.halfAngleDegrees) * Math.PI) / 360;
    const flank = add('warrior', 'warrior', 'light', 0);
    flank.getComponent(Transform).moveTo({
      x: BOSS_AT.x + reach * cos(angle),
      y: BOSS_AT.y + reach * sin(angle),
    });
    const behind = add('warrior', 'warrior', 'light', -1);
    state.entities.beginBossMove(boss.id, WIDE_SWEEP.id, 0);

    land();
    expect([flank, behind].map(damageOf)).toEqual([WIDE_SWEEP.damage, 0]);
    expect(flank.getComponent(Movement).push).not.toEqual({ x: 0, y: 0 });
  });

  it('beams along its facing: hits every unit on the line out to its length, and stays put', () => {
    const { state, boss, add, land } = setUp();
    boss.getComponent(Transform).face({ x: 1, y: 0 });
    const near = add('warrior', 'warrior', 'light', 1);
    const far = add('warrior', 'warrior', 'light', BEAM.length - 0.1);
    const aside = add('warrior', 'warrior', 'light', 0);
    aside.getComponent(Transform).moveTo({ x: BOSS_AT.x + 5, y: BOSS_AT.y + BEAM.width / 2 + 0.1 });
    const beyond = add('warrior', 'warrior', 'light', BEAM.length + 0.1);
    const behind = add('warrior', 'warrior', 'light', -1);
    state.entities.beginBossMove(boss.id, BEAM.id, 0);

    land();
    expect([near, far, aside, beyond, behind].map(damageOf)).toEqual([
      BEAM.damage,
      BEAM.damage,
      0,
      0,
      0,
    ]);
    expect(boss.getComponent(Movement).push).toEqual({ x: 0, y: 0 });
    expect(near.getComponent(Movement).push).toEqual({ x: 0, y: 0 });
  });

  it('roars with no gameplay effect: the landing event only', () => {
    const { state, boss, add, land, executed } = setUp();
    const near = add('warrior', 'warrior', 'light', 1);
    state.entities.beginBossMove(boss.id, ROAR.id, 0);

    land();
    expect(executed).toEqual([{ bossId: boss.id, move: ROAR.id }]);
    expect(damageOf(near)).toBe(0);
    expect(near.getComponent(Movement).push).toEqual({ x: 0, y: 0 });
  });

  it('lands nothing for a dead boss', () => {
    const { state, boss, add, land, executed } = setUp();
    const target = add('light-mob', 'training-dummy', 'dark', 1);
    state.entities.beginBossMove(boss.id, SLAM.id, 0);
    boss.getComponent(Health).applyDamage(10_000_000);

    land();
    expect(executed).toEqual([]);
    expect(damageOf(target)).toBe(0);
  });
});
