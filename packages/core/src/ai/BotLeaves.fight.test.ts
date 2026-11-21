import { describe, expect, it } from 'vitest';

import { Combat } from '../components/Combat';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { RETREAT_STRUCTURES } from '../content/ai/botLaner';
import { NORMAL_BOT } from '../content/ai/difficulties/normal';
import type { UnitAttack } from '../content/units/units.types';
import { Entity } from '../entities/Entity';
import { BLOCKED_LANE_MAP } from '../map/__fixtures__/blockedLaneMap';
import { SpaceIndex } from '../physics/SpaceIndex';
import type { CollisionQuery } from '../state/CollisionQuery.types';
import { GameState } from '../state/GameState';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { allReady } from '../state/__fixtures__/stubReadiness';
import { SeededRandom } from '../utils/SeededRandom';
import type { BotTurn } from './BotLegendController.types';
import { BotLeaves } from './BotLeaves';
import { Perception } from './perception/Perception';
import { SHIPPED_LINE_OF_FIRE } from '../state/__fixtures__/shippedLineOfFire';
import { CONTACT_EPSILON } from '../utils/circlePolygon.constants';

const leaves = new BotLeaves({
  difficulties: { normal: NORMAL_BOT },
  retreatTo: RETREAT_STRUCTURES,
  readiness: allReady,
  lineOfFire: SHIPPED_LINE_OF_FIRE,
});

const RANGED: UnitAttack = {
  strategy: 'ranged-projectile',
  damage: 10,
  reach: 15,
  interval: 10,
  projectile: { projectileId: 'magus-bolt', falloff: null },
};
const MELEE: UnitAttack = { strategy: 'melee', damage: 10, reach: 15, interval: 10 };

/** A body at a fixed place, with or without an attack. */
class Body extends Entity {
  public readonly kind = 'warrior';
  public readonly family = 'legend';
  public constructor(
    id: string,
    private readonly at: { x: number; y: number },
    private readonly attack?: UnitAttack,
  ) {
    super(id, 'warrior');
  }
  protected installComponents(): void {
    this.addComponent(new Transform(this.at, 1));
    if (this.attack !== undefined) {
      this.addComponent(new Combat({ basic: this.attack }));
    }
  }
}

/** A `fight` turn: the bot at (40, 20), the enemy 10 m east, and `collisions` between them. */
const fightTurn = (attack: UnitAttack, collisions: CollisionQuery | null): BotTurn => {
  const space = new SpaceIndex(BLOCKED_LANE_MAP.width, BLOCKED_LANE_MAP.height, 2);
  space.begin(2);
  space.add('bot', 40, 20);
  space.add('enemy', 50, 20);
  space.commit();
  const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(BLOCKED_LANE_MAP), {
    space,
    paths: null,
    collisions,
  });
  for (const body of [
    new Body('bot', { x: 40, y: 20 }, attack),
    new Body('enemy', { x: 50, y: 20 }),
  ]) {
    body.spawn({});
    state.entities.add(body);
  }
  const memory = {
    lane: 'lane-0',
    isRetreating: false,
    targetId: null,
    nextCastTick: 0,
    isHalted: false,
  };
  return {
    state,
    id: 'bot',
    team: 'light',
    position: { x: 40, y: 20 },
    difficulty: NORMAL_BOT,
    perception: new Perception(state),
    rng: new SeededRandom(1),
    memory,
    next: memory,
    commands: [],
    enemy: 'enemy',
    objective: null,
    destination: null,
  };
};

const WALLED: CollisionQuery = { reach: () => 4 };
const OPEN: CollisionQuery = { reach: (_from, _direction, distance) => distance };

/** The headings the turn commanded; `(0, 0)` is a halt, which is how a bot holds. */
const headings = (turn: BotTurn) =>
  turn.commands.flatMap((command) => (command.type === 'move' ? [command.direction] : []));

describe('BotLeaves.fight: line of fire for a ranged attack', () => {
  it('moves toward the enemy instead of holding when a wall blocks the shot', () => {
    const turn = fightTurn(RANGED, WALLED);

    expect(leaves.fight(turn)).toBe('running');
    expect(headings(turn)).toEqual([{ x: 5, y: 0 }]);
  });

  it('holds when the line is clear', () => {
    const turn = fightTurn(RANGED, OPEN);

    expect(leaves.fight(turn)).toBe('running');
    expect(headings(turn)).toEqual([{ x: 0, y: 0 }]);
  });

  it('holds when the shot stops only its own radius short of the aim point (the target touches it)', () => {
    // A wall at the aim point (the enemy's centre, 10 m east), kept short of as the resolver does.
    const touching: CollisionQuery = {
      reach: (_from, _direction, distance, radius) =>
        Math.min(distance, 10 - radius - CONTACT_EPSILON),
    };
    const turn = fightTurn(RANGED, touching);

    expect(leaves.fight(turn)).toBe('running');
    expect(headings(turn)).toEqual([{ x: 0, y: 0 }]);
  });

  it('holds when the match has no collision rule', () => {
    const turn = fightTurn(RANGED, null);

    expect(leaves.fight(turn)).toBe('running');
    expect(headings(turn)).toEqual([{ x: 0, y: 0 }]);
  });

  it('holds a melee attack in reach whatever the collision rule says', () => {
    const turn = fightTurn(MELEE, WALLED);

    expect(leaves.fight(turn)).toBe('running');
    expect(headings(turn)).toEqual([{ x: 0, y: 0 }]);
  });
});

/** A `siege` turn: the `fight` turn's enemy is instead the objective, a 1 m tower 10 m east. */
const siegeTurn = (attack: UnitAttack, collisions: CollisionQuery | null): BotTurn => ({
  ...fightTurn(attack, collisions),
  enemy: null,
  objective: {
    id: 'enemy',
    kind: 'spawner-tower',
    team: 'dark',
    lane: 'lane-0',
    x: 50,
    y: 20,
    radius: 1,
    startingHealth: 3000,
    progress: 60,
    frontProgress: 55,
    isBreakable: true,
  },
});

describe('BotLeaves.siege: line of fire for a ranged attack (DEC-317)', () => {
  it('closes in on the edge of the objective instead of holding when a wall blocks the shot', () => {
    const turn = siegeTurn(RANGED, WALLED);

    expect(leaves.siege(turn)).toBe('running');
    expect(headings(turn)).toEqual([{ x: 9, y: 0 }]);
  });

  it('holds when the line is clear', () => {
    const turn = siegeTurn(RANGED, OPEN);

    expect(leaves.siege(turn)).toBe('running');
    expect(headings(turn)).toEqual([{ x: 0, y: 0 }]);
  });
});
