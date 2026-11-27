import { describe, expect, it } from 'vitest';

import { applyCommand } from '../commands/applyCommand';
import { createDefaultCommandHandlers } from '../commands/defaultCommandHandlers';
import { Combat } from '../components/Combat';
import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { RETREAT_STRUCTURES } from '../content/ai/botLaner';
import { NORMAL_BOT } from '../content/ai/difficulties/normal';
import { loadDefaultContent } from '../content/loadDefaultContent';
import type { UnitAttack } from '../content/units/units.types';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
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

/** The types of the commands the turn sent, in order. */
const commandTypes = (turn: BotTurn) => turn.commands.map(({ type }) => type);

/** The turn of a bot that already holds a lock on `targetId` (its memory says so). */
const holdingLock = (turn: BotTurn, targetId: string): BotTurn => {
  const memory = { ...turn.memory, targetId };
  return { ...turn, memory, next: memory };
};

describe('BotLeaves.fight: line of fire for a ranged attack', () => {
  it('moves toward the enemy instead of holding when a wall blocks the shot, and takes no lock', () => {
    const turn = fightTurn(RANGED, WALLED);

    expect(leaves.fight(turn)).toBe('running');
    expect(headings(turn)).toEqual([{ x: 5, y: 0 }]);
    expect(commandTypes(turn)).toEqual(['move']);
    expect(turn.next.targetId).toBeNull();
  });

  it('drops a lock it holds when a wall blocks the shot: a stop, then a move on (DEC-317 addendum)', () => {
    const turn = holdingLock(fightTurn(RANGED, WALLED), 'enemy');

    expect(leaves.fight(turn)).toBe('running');
    expect(commandTypes(turn)).toEqual(['stop', 'move']);
    expect(headings(turn)).toEqual([{ x: 5, y: 0 }]);
    expect(turn.next.targetId).toBeNull();
  });

  it('keeps a lock it holds and holds still when the line is clear', () => {
    const turn = holdingLock(fightTurn(RANGED, OPEN), 'enemy');

    expect(leaves.fight(turn)).toBe('running');
    expect(commandTypes(turn)).toEqual(['move']);
    expect(headings(turn)).toEqual([{ x: 0, y: 0 }]);
    expect(turn.next.targetId).toBe('enemy');
  });

  it('holds when the line is clear', () => {
    const turn = fightTurn(RANGED, OPEN);

    expect(leaves.fight(turn)).toBe('running');
    expect(headings(turn)).toEqual([{ x: 0, y: 0 }]);
  });

  it('holds when a wall touches the near edge of the enemy (the shot touches the enemy first)', () => {
    // The resolver stops CONTACT_EPSILON short of a wall at the shot's contact with the enemy.
    const touching: CollisionQuery = {
      reach: (_from, _direction, distance) => distance - CONTACT_EPSILON,
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
    expect(commandTypes(turn)).toEqual(['move']);
  });

  it('drops a lock it holds on the objective when a wall blocks the shot, and closes in (DEC-317 addendum)', () => {
    const turn = holdingLock(siegeTurn(RANGED, WALLED), 'enemy');

    expect(leaves.siege(turn)).toBe('running');
    expect(commandTypes(turn)).toEqual(['stop', 'move']);
    expect(headings(turn)).toEqual([{ x: 9, y: 0 }]);
    expect(turn.next.targetId).toBeNull();
  });

  it('holds when the line is clear', () => {
    const turn = siegeTurn(RANGED, OPEN);

    expect(leaves.siege(turn)).toBe('running');
    expect(headings(turn)).toEqual([{ x: 0, y: 0 }]);
  });
});

/**
 * A staff Magus bot at (40, 20) holding a lock on a training dummy 10 m east, in reach, with
 * `collisions` between them. Its `fight` turn's commands go through the match's command handlers,
 * as on the next tick of a match.
 */
const fightThroughHandlers = (collisions: CollisionQuery) => {
  const units = loadDefaultContent(30);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    units,
    undefined,
    loadWeapons(30),
  );
  const bot = factory.create('magus', 'magus', { position: { x: 40, y: 20 }, team: 'light' });
  const enemy = factory.create('light-mob', 'training-dummy', {
    position: { x: 50, y: 20 },
    team: 'dark',
  });
  const space = new SpaceIndex(BLOCKED_LANE_MAP.width, BLOCKED_LANE_MAP.height, 2);
  space.begin(2);
  space.add(bot.id, 40, 20);
  space.add(enemy.id, 50, 20);
  space.commit();
  const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(BLOCKED_LANE_MAP), {
    space,
    paths: null,
    collisions,
  });
  state.entities.add(bot);
  state.entities.add(enemy);
  expect(state.entities.setAttackTarget(bot.id, enemy.id)).toBe(true);
  // No cast is due, so the turn holds only its attack and movement commands.
  const memory = {
    lane: 'lane-0',
    isRetreating: false,
    targetId: enemy.id,
    nextCastTick: Number.POSITIVE_INFINITY,
    isHalted: false,
  };
  const turn: BotTurn = {
    ...fightTurn(RANGED, collisions),
    state,
    id: bot.id,
    perception: new Perception(state),
    memory,
    next: memory,
    enemy: enemy.id,
  };
  leaves.fight(turn);
  const handlers = createDefaultCommandHandlers(allReady);
  for (const command of turn.commands) {
    applyCommand(command, handlers, { state, factory });
  }
  return { state, bot, enemy };
};

describe('BotLeaves.fight through the command handlers (DEC-317 addendum)', () => {
  it('a bot whose enemy is behind a wall drops its lock and keeps moving, so it fires at nothing', () => {
    const { state, bot } = fightThroughHandlers(WALLED);

    // `CombatSystem` attacks only a unit with a target or an aim point: this bot has neither.
    expect(state.entities.attackTargetOf(bot.id)).toBeNull();
    expect(bot.getComponent(Combat).aimPoint).toBeNull();
    expect(bot.getComponent(Movement).heading.x).toBeGreaterThan(0);
  });

  it('with a clear line it keeps its lock and stands to shoot', () => {
    const { state, bot, enemy } = fightThroughHandlers(OPEN);

    expect(state.entities.attackTargetOf(bot.id)).toBe(enemy.id);
    expect(bot.getComponent(Movement).heading).toEqual({ x: 0, y: 0 });
  });
});
