import type {
  AbilitySlot,
  Command,
  EntitySnapshot,
  Team,
  InputIntent,
  MapObject,
  MapObjectSnapshot,
  Simulation,
  Vec2,
} from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import { AbilityCasts } from './AbilityCasts';
import type { IntentSource } from './Match.types';
import { PlayerCommands } from './PlayerCommands';

const ACTOR = 'legend-1';
const HOUSE_ENTITY = 'house-entity';

/** An intent source the test steers by hand. */
class ScriptedIntent implements IntentSource {
  public move: Vec2 = { x: 0, y: 0 };

  public isAttacking = false;

  public isMeleeAttacking = false;

  public aim: Vec2 | null = null;

  public triggered: readonly AbilitySlot[] = [];

  public read(): InputIntent {
    return {
      move: this.move,
      isAttacking: this.isAttacking,
      isMeleeAttacking: this.isMeleeAttacking,
      aim: this.aim,
      triggered: this.triggered,
    };
  }
}

/** One living house, 4 × 4 at the origin; the attack aims at its centre. */
const HOUSE: MapObject = {
  id: 'house',
  kind: 'house',
  isBlocking: true,
  footprints: [
    [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ],
  ],
};
const HOUSE_STATES: readonly MapObjectSnapshot[] = [
  { id: 'house', entityId: HOUSE_ENTITY, health: { current: 100, max: 100 }, isDestroyed: false },
];

const unit = (id: string, team: Team, x: number, y: number): EntitySnapshot => ({
  id,
  kind: 'minion',
  family: 'mob',
  definitionId: 'minion',
  team,
  transform: { x, y, radius: 1, facing: { x: 1, y: 0 } },
  health: { current: 10, max: 10 },
  progression: null,
  aether: null,
  area: null,
  capture: null,
  statuses: null,
  projectile: null,
  swing: null,
});
const PLAYER: EntitySnapshot = { ...unit(ACTOR, 'light', 20, 20), family: 'legend' };
/** A dark-team minion standing on the house, so the house and the unit overlap. */
const ENEMY = unit('enemy-1', 'dark', 2, 2);

/** The snapshot parts a target is picked from: `entities` and the house's state. */
const snapshotOf = (
  entities: readonly EntitySnapshot[],
  mapObjects: readonly MapObjectSnapshot[] = HOUSE_STATES,
) => ({ entities, mapObjects });

const setUp = () => {
  const input = new ScriptedIntent();
  const enqueueCommand = vi.fn<Simulation['enqueueCommand']>();
  const casts = new AbilityCasts({ enqueueCommand }, vi.fn(), {
    usesAim: () => true,
    legendAt: () => null,
  });
  const commands = new PlayerCommands(
    input,
    { enqueueCommand },
    { screenToWorld: (point) => point },
    [HOUSE],
    casts,
  );
  const queued = (type: Command['type']): number =>
    enqueueCommand.mock.calls.filter(([command]) => command.type === type).length;
  const tick = (): boolean => commands.apply(ACTOR);
  return { input, commands, casts, enqueueCommand, queued, tick };
};

describe('PlayerCommands', () => {
  it('queues attack-aim only when the held point changes (DEC-184: no target needed)', () => {
    const { input, queued, tick, enqueueCommand } = setUp();
    input.isAttacking = true;
    input.aim = { x: 40, y: 40 };

    for (let count = 0; count < 5; count += 1) tick();
    expect(queued('attack-aim')).toBe(1);
    expect(enqueueCommand).toHaveBeenCalledWith({
      type: 'attack-aim',
      actorId: ACTOR,
      aim: { x: 40, y: 40 },
    });
    input.aim = { x: 41, y: 40 };
    tick();
    tick();
    expect(queued('attack-aim')).toBe(2);
    expect(enqueueCommand).toHaveBeenLastCalledWith({
      type: 'attack-aim',
      actorId: ACTOR,
      aim: { x: 41, y: 40 },
    });
    expect(queued('attack-target')).toBe(0);
  });

  it('queues one attack-aim with a null aim on release, and nothing while up', () => {
    const { input, queued, tick, enqueueCommand } = setUp();
    input.aim = { x: 2, y: 2 };
    tick();
    expect(queued('attack-aim')).toBe(0);
    input.isAttacking = true;
    tick();
    input.isAttacking = false;
    tick();
    tick();
    tick();

    expect(queued('attack-aim')).toBe(2);
    expect(enqueueCommand).toHaveBeenLastCalledWith({
      type: 'attack-aim',
      actorId: ACTOR,
      aim: null,
    });
  });

  it('queues attack-aim again after a stop while the button is still held', () => {
    const { input, queued, tick } = setUp();
    input.isAttacking = true;
    input.aim = { x: 2, y: 2 };
    tick();
    input.move = { x: 1, y: 0 };
    tick();
    input.move = { x: 0, y: 0 };
    tick();
    tick();
    expect(queued('attack-aim')).toBe(2);
  });

  it('queues attack-aim with mode melee while the melee key is held, once per point and mode (DEC-308)', () => {
    const { input, queued, tick, enqueueCommand } = setUp();
    input.isMeleeAttacking = true;
    input.aim = { x: 2, y: 2 };

    for (let count = 0; count < 4; count += 1) tick();
    expect(queued('attack-aim')).toBe(1);
    expect(enqueueCommand).toHaveBeenCalledWith({
      type: 'attack-aim',
      actorId: ACTOR,
      aim: { x: 2, y: 2 },
      mode: 'melee',
    });
    // Both held: melee wins, so nothing new is queued.
    input.isAttacking = true;
    tick();
    expect(queued('attack-aim')).toBe(1);
    // Melee released, the click still held on the same point: a new basic command.
    input.isMeleeAttacking = false;
    tick();
    expect(queued('attack-aim')).toBe(2);
    expect(enqueueCommand).toHaveBeenLastCalledWith({
      type: 'attack-aim',
      actorId: ACTOR,
      aim: { x: 2, y: 2 },
    });
  });

  it('queues a cast-ability for each pressed slot in quick cast, aimed at the pointer', () => {
    const { input, queued, tick, enqueueCommand } = setUp();
    input.aim = { x: 12, y: 3 };
    input.triggered = ['ability-3'];

    tick();
    input.triggered = [];
    tick();

    expect(queued('cast-ability')).toBe(1);
    expect(enqueueCommand).toHaveBeenCalledWith({
      type: 'cast-ability',
      actorId: ACTOR,
      slot: 'ability-3',
      aim: { point: { x: 12, y: 3 }, targetId: null },
    });
  });

  it('in aim-then-click, the confirming click casts and does not also attack', () => {
    const { input, casts, queued, tick, enqueueCommand } = setUp();
    casts.setCastMode('aim-then-click');
    input.aim = { x: 2, y: 2 };

    input.triggered = ['ability-1'];
    tick();
    input.triggered = [];
    input.isAttacking = true;
    tick();
    tick();

    expect(queued('cast-ability')).toBe(1);
    expect(queued('attack-aim')).toBe(0);
    expect(enqueueCommand).toHaveBeenCalledWith({
      type: 'cast-ability',
      actorId: ACTOR,
      slot: 'ability-1',
      aim: { point: { x: 2, y: 2 }, targetId: null },
    });
    input.isAttacking = false;
    tick();
    input.isAttacking = true;
    tick();
    expect(queued('attack-aim')).toBe(1);
  });

  it('in aim-then-click, a held attack pauses while a slot is selected and resumes on cancel', () => {
    const { input, casts, queued, tick } = setUp();
    casts.setCastMode('aim-then-click');
    input.aim = { x: 2, y: 2 };
    input.isAttacking = true;
    tick();
    expect(queued('attack-aim')).toBe(1);

    input.triggered = ['ability-2'];
    tick();
    input.triggered = [];
    tick();
    // The pause releases the attack: one null aim, then nothing more while paused.
    expect(queued('attack-aim')).toBe(2);
    casts.cancel();
    tick();

    expect(queued('attack-aim')).toBe(3);
    expect(queued('cast-ability')).toBe(0);
  });

  it('queues no attack while the canvas gestures own the press (minimap or explorer)', () => {
    const { input, commands, queued, tick } = setUp();
    input.isAttacking = true;
    input.aim = { x: 2, y: 2 };

    commands.setPointerClaimed(true);
    tick();
    tick();
    expect(queued('attack-aim')).toBe(0);
    commands.setPointerClaimed(false);
    tick();

    expect(queued('attack-aim')).toBe(1);
  });

  it("queues one attack-target on the living map object under the explorer's click (DEC-150)", () => {
    const { commands, enqueueCommand } = setUp();

    commands.attackObjectAt(ACTOR, { x: 2, y: 2 }, snapshotOf([PLAYER]));

    expect(enqueueCommand.mock.calls.map(([command]) => command)).toEqual([
      { type: 'attack-target', actorId: ACTOR, targetId: HOUSE_ENTITY },
    ]);
  });

  it("queues no attack on the explorer's click on open ground or a destroyed object", () => {
    const { commands, enqueueCommand } = setUp();
    const destroyed = HOUSE_STATES.map((state) => ({ ...state, isDestroyed: true }));

    commands.attackObjectAt(ACTOR, { x: 10, y: 10 }, snapshotOf([PLAYER]));
    commands.attackObjectAt(ACTOR, { x: 2, y: 2 }, snapshotOf([PLAYER], destroyed));
    // A snapshot with no map objects (`mapObjects` is optional) has none to hit.
    commands.attackObjectAt(ACTOR, { x: 2, y: 2 }, { entities: [PLAYER] });

    expect(enqueueCommand).not.toHaveBeenCalled();
  });

  it('attacks the enemy unit under a click, not the house it overlaps', () => {
    const { commands, enqueueCommand } = setUp();

    const isUnit = commands.attackUnitAt(ACTOR, { x: 2, y: 2 }, snapshotOf([PLAYER, ENEMY]));

    expect(isUnit).toBe(true);
    expect(enqueueCommand.mock.calls.map(([command]) => command)).toEqual([
      { type: 'attack-target', actorId: ACTOR, targetId: 'enemy-1' },
    ]);
  });

  it("ignores allies and dead units on the explorer's click on a unit", () => {
    const { commands, enqueueCommand } = setUp();
    const ally = unit('ally-1', 'light', 2, 2);
    const dead = { ...ENEMY, health: { current: 0, max: 10 } };

    expect(commands.attackUnitAt(ACTOR, { x: 2, y: 2 }, snapshotOf([PLAYER, ally, dead]))).toBe(
      false,
    );
    expect(enqueueCommand).not.toHaveBeenCalled();
  });

  it('queues move or stop only when the axes change; returns whether the player moves', () => {
    const { input, enqueueCommand, tick } = setUp();
    expect(tick()).toBe(false);
    expect(enqueueCommand).not.toHaveBeenCalled();

    input.move = { x: 1, y: 0 };
    expect(tick()).toBe(true);
    expect(tick()).toBe(true);
    input.move = { x: 0, y: 0 };
    expect(tick()).toBe(false);

    expect(enqueueCommand.mock.calls.map(([command]) => command)).toEqual([
      { type: 'move', actorId: ACTOR, direction: { x: 1, y: 0 } },
      { type: 'stop', actorId: ACTOR },
    ]);
  });
});
