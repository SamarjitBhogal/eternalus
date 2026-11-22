import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { Combat } from '../components/Combat';
import { Footprint } from '../components/Footprint';
import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadProjectiles } from '../content/projectiles/loadProjectiles';
import type { MeleeAttack, RangedAttack, UnitAttack } from '../content/units/units.types';
import { Entity } from '../entities/Entity';
import { CollisionResolver } from '../physics/CollisionResolver';
import { StaticCollisionIndex } from '../physics/StaticCollisionIndex';
import type { Team } from '../teams/teams.types';
import { cos, sin } from '../utils/deterministicMath';
import type { Polygon, Vec2 } from '../utils/geometry.types';
import { GameState } from './GameState';
import { LineOfFire } from './LineOfFire';

/*
 * The line-of-fire query against the match's real collision rule: `CollisionResolver.reach` on a
 * `StaticCollisionIndex`, as `Simulation` builds them (architecture 10 §7), not a stub.
 */

const CONFIG = createDefaultGameConfig();
const PROJECTILES = loadProjectiles(CONFIG.tickRate);
/** The shipped bolt's radius (0.15 m): the width a shot sweeps. */
const SHOT_RADIUS = PROJECTILES.get('magus-bolt').footprintRadius;
const RANGED: RangedAttack = {
  strategy: 'ranged-projectile',
  damage: 100,
  reach: 15,
  interval: 27,
  projectile: { projectileId: 'magus-bolt', falloff: null },
};
const MELEE: MeleeAttack = { strategy: 'melee', damage: 100, reach: 1, interval: 27 };
const BOUNDS = { x: -500, y: -500, width: 1000, height: 1000 };

/** A box `width` by `height` with its lower-left corner at (`x`, `y`). */
const box = (x: number, y: number, width: number, height: number): Polygon => [
  { x, y },
  { x: x + width, y },
  { x: x + width, y: y + height },
  { x, y: y + height },
];

/** A `size` by `size` square around `centre`, turned by `angle` radians. */
const turnedSquare = (centre: Vec2, size: number, angle: number): Polygon =>
  [
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 },
  ].map(({ x, y }) => ({
    x: centre.x + (size / 2) * (x * cos(angle) - y * sin(angle)),
    y: centre.y + (size / 2) * (x * sin(angle) + y * cos(angle)),
  }));

type BodySpec = {
  readonly at: Vec2;
  readonly radius: number;
  /** An attack makes it a shooter. */
  readonly attack?: UnitAttack;
  /** A structure's outline (`Footprint`): shots are aimed at its nearest point. */
  readonly outline?: readonly Polygon[];
  /** A team gives it a `TeamMembership`, `Health` and a collider: a body a shot can stop on. */
  readonly team?: Team;
  /** With a team: it takes no damage now (a forest camp). */
  readonly isUnbreakable?: boolean;
  /** With a team and an outline: units walk on it (a gate's passage). */
  readonly isWalkOn?: boolean;
};

/** A circle, a shooter, or a structure with an outline. */
class Body extends Entity {
  public readonly kind = 'dummy';
  public readonly family = 'mob';
  protected installComponents(context: unknown): void {
    const { at, radius, attack, outline, team, isUnbreakable, isWalkOn } = context as BodySpec;
    this.addComponent(new Transform(at, radius));
    if (attack !== undefined) this.addComponent(new Combat({ basic: attack }));
    if (outline !== undefined) {
      this.addComponent(new Footprint(outline, { isWalkOn: isWalkOn === true }));
    }
    if (team !== undefined) {
      this.addComponent(new TeamMembership(team));
      this.addComponent(new Health(100));
      const collider = new Collider({ kind: 'circle', radius }, 'unit');
      collider.setUnbreakable(isUnbreakable === true);
      this.addComponent(collider);
    }
  }
}

/** A match whose walls are `walls`, or one with no collision rule when `walls` is `null`. */
const world = (walls: readonly Polygon[] | null) => {
  const state = new GameState(
    CONFIG,
    1,
    null,
    walls === null
      ? {}
      : {
          collisions: new CollisionResolver(
            new StaticCollisionIndex(
              walls.map((polygon, i) => ({ id: `wall-${String(i)}`, polygon })),
            ),
            BOUNDS,
          ),
        },
  );
  let counter = 0;
  const add = (spec: BodySpec): string => {
    counter += 1;
    const body = new Body(`body-${String(counter)}`, 'dummy');
    body.spawn(spec);
    state.entities.add(body);
    return body.id;
  };
  /** A Magus-sized shooter with the ranged attack (or `attack`) at `at`. */
  const shooter = (at: Vec2, attack: UnitAttack = RANGED, team?: Team): string =>
    add({ at, radius: 0.75, attack, ...(team === undefined ? {} : { team }) });
  return { state, add, shooter };
};

const lineOfFire = new LineOfFire(PROJECTILES);

describe('LineOfFire', () => {
  it('is clear to a unit with nothing in the way', () => {
    const { state, add, shooter } = world([]);
    const from = shooter({ x: 0, y: 0 });
    const target = add({ at: { x: 10, y: 0 }, radius: 1 });

    expect(lineOfFire.isClear(state, from, target)).toBe(true);
  });

  it('is blocked by a thin wall between the shooter and a unit', () => {
    const { state, add, shooter } = world([box(5, -5, 0.5, 10)]);
    const from = shooter({ x: 0, y: 0 });
    const target = add({ at: { x: 10, y: 0 }, radius: 1 });

    expect(lineOfFire.isClear(state, from, target)).toBe(false);
  });

  it('is blocked by a corner only the shot width touches, clear past that width', () => {
    // The line itself passes the corner; the bolt's 0.15 m radius does not.
    const grazed = world([box(5, -5, 0.5, 5 - SHOT_RADIUS / 2)]);
    const passed = world([box(5, -5, 0.5, 5 - SHOT_RADIUS * 1.5)]);
    const grazedFrom = grazed.shooter({ x: 0, y: 0 });
    const grazedTarget = grazed.add({ at: { x: 10, y: 0 }, radius: 1 });
    const passedFrom = passed.shooter({ x: 0, y: 0 });
    const passedTarget = passed.add({ at: { x: 10, y: 0 }, radius: 1 });

    expect(lineOfFire.isClear(grazed.state, grazedFrom, grazedTarget)).toBe(false);
    expect(lineOfFire.isClear(passed.state, passedFrom, passedTarget)).toBe(true);
  });

  it('touches a unit at the edge of its circle, before a wall past that edge', () => {
    // The wall crosses the unit's circle behind its near edge (x 9): the shot touches the unit
    // first, as ProjectileSystem lands it.
    const { state, add, shooter } = world([box(9.6, -5, 0.1, 10)]);
    const from = shooter({ x: 0, y: 0 });
    const target = add({ at: { x: 10, y: 0 }, radius: 1 });

    expect(lineOfFire.isClear(state, from, target)).toBe(true);
  });

  it('reads a fort whose outline is also the wall as clear, never blocked by rounding (C3)', () => {
    let tried = 0;
    for (let i = 0; i < 400; i += 1) {
      // The wall is the fort's own outline, turned and moved a little each time, and the shooter
      // stands at every side of it: wall and fort contact then differ by rounding alone.
      const centre = { x: 20 + i * 0.013, y: -3 + i * 0.0071 };
      const block = turnedSquare(centre, 2.3, i * 0.037);
      const { state, add, shooter } = world([block]);
      const fort = add({ at: centre, radius: 1.6, outline: [block] });
      const side = i * 0.61;
      const from = shooter({
        x: centre.x + (9 + (i % 7) * 0.3) * cos(side),
        y: centre.y + (9 + (i % 7) * 0.3) * sin(side),
      });

      tried += 1;
      expect(lineOfFire.isClear(state, from, fort)).toBe(true);
    }
    expect(tried).toBe(400);
  });

  it('is blocked by a wall in front of a fort, though the fort is its own wall too', () => {
    const block = box(10, -2, 3, 4);
    const { state, add, shooter } = world([block, box(5, -5, 0.5, 10)]);
    const fort = add({ at: { x: 11.5, y: 0 }, radius: 2, outline: [block] });
    const from = shooter({ x: 0, y: 0 });

    expect(lineOfFire.isClear(state, from, fort)).toBe(false);
  });

  it('is clear from inside the outline of the structure it shoots, even across a wall', () => {
    const { state, add, shooter } = world([box(4, -5, 0.5, 20)]);
    const fort = add({ at: { x: 5, y: 5 }, radius: 5, outline: [box(0, 0, 10, 10)] });
    const from = shooter({ x: 2, y: 5 });

    expect(lineOfFire.isClear(state, from, fort)).toBe(true);
  });

  it('is blocked past the range its shot flies, with nothing in the way', () => {
    const shortShots = new LineOfFire({ get: (id) => ({ ...PROJECTILES.get(id), range: 8 }) });
    const { state, add, shooter } = world([]);
    const from = shooter({ x: 0, y: 0 });
    // The shot touches the near unit 6.85 m out and the far one 8.85 m out (radius 1, shot 0.15).
    const near = add({ at: { x: 8, y: 0 }, radius: 1 });
    const far = add({ at: { x: 10, y: 0 }, radius: 1 });

    expect(shortShots.isClear(state, from, near)).toBe(true);
    expect(shortShots.isClear(state, from, far)).toBe(false);
  });

  it('is clear for a melee attack, an unknown id, and a match with no collision rule', () => {
    const walled = world([box(5, -5, 0.5, 10)]);
    const melee = walled.shooter({ x: 0, y: 0 }, MELEE);
    const ranged = walled.shooter({ x: 0, y: 1 });
    const target = walled.add({ at: { x: 10, y: 0 }, radius: 1 });
    const open = world(null);
    const openFrom = open.shooter({ x: 0, y: 0 });
    const openTarget = open.add({ at: { x: 10, y: 0 }, radius: 1 });

    expect(lineOfFire.isClear(walled.state, melee, target)).toBe(true);
    expect(lineOfFire.isClear(walled.state, ranged, 'missing')).toBe(true);
    expect(lineOfFire.isClear(walled.state, 'missing', target)).toBe(true);
    expect(lineOfFire.isClear(open.state, openFrom, openTarget)).toBe(true);
  });

  describe('bodies that take no damage (the rule that stops a shot, AreaHitQuery.stopsShot)', () => {
    /** A light bot at the origin, a dark enemy at 10 and a neutral forest camp between them at 5. */
    const scene = () => {
      const { state, add, shooter } = world([]);
      const bot = shooter({ x: 0, y: 0 }, RANGED, 'light');
      const enemy = add({ at: { x: 10, y: 0 }, radius: 1, team: 'dark' });
      return { state, add, bot, enemy };
    };

    it('is blocked by a camp that takes no damage between the bot and its enemy, and clear once it takes damage again (B9)', () => {
      const { state, add, bot, enemy } = scene();
      const camp = add({ at: { x: 5, y: 0.5 }, radius: 1, team: 'neutral', isUnbreakable: true });

      expect(lineOfFire.isClear(state, bot, enemy)).toBe(false);
      expect(lineOfFire.isClear(state, bot, camp)).toBe(true);

      state.entities.get(camp)?.getComponent(Collider).setUnbreakable(false);
      expect(lineOfFire.isClear(state, bot, enemy)).toBe(true);
    });

    it('is blocked when the shot width only grazes the camp, and clear past that width', () => {
      const grazed = scene();
      const passed = scene();
      const camp = { radius: 1, team: 'neutral', isUnbreakable: true } as const;
      grazed.add({ ...camp, at: { x: 5, y: 1 + SHOT_RADIUS / 2 } });
      passed.add({ ...camp, at: { x: 5, y: 1 + SHOT_RADIUS * 1.5 } });

      expect(lineOfFire.isClear(grazed.state, grazed.bot, grazed.enemy)).toBe(false);
      expect(lineOfFire.isClear(passed.state, passed.bot, passed.enemy)).toBe(true);
    });

    it('is not blocked by such a body that is the target, an ally, behind the target, or a walk-on outline it does not aim at', () => {
      const { state, add, bot, enemy } = scene();
      const unbreakable = { radius: 1, isUnbreakable: true } as const;
      const closedGate = add({ ...unbreakable, at: { x: 20, y: 0 }, team: 'dark' });
      add({ ...unbreakable, at: { x: 3, y: 0 }, team: 'light' });
      add({ ...unbreakable, at: { x: 13, y: 0 }, team: 'neutral' });
      add({
        ...unbreakable,
        at: { x: 6, y: 0 },
        team: 'dark',
        outline: [box(5, -2, 2, 4)],
        isWalkOn: true,
      });

      expect(lineOfFire.isClear(state, bot, enemy)).toBe(true);
      expect(lineOfFire.isClear(state, bot, closedGate)).toBe(false);
    });
  });
});
