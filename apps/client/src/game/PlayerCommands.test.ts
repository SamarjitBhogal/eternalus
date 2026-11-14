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

  public aim: Vec2 | null = null;

  public triggered: readonly AbilitySlot[] = [];

  public read(): InputIntent {
    return {
      move: this.move,
      isAttacking: this.isAttacking,
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
  transform: { x, y, radius: 1 },
  health: { current: 10, max: 10 },
  progression: null,
  aether: null,
  area: null,
  capture: null,
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
  const casts = new AbilityCasts({ enqueueCommand }, vi.fn());
  const commands = new PlayerCommands(
    input,
    { enqueueCommand },
    { screenToWorld: (point) => point },
    [HOUSE],
    casts,
  );
  const queued = (type: Command['type']): number =>
    enqueueCommand.mock.calls.filter(([command]) => command.type === type).length;
  const tick = (entities: readonly EntitySnapshot[] = [PLAYER]): boolean => {
    return commands.apply(ACTOR, snapshotOf(entities));
  };
  return { input, commands, casts, enqueueCommand, queued, tick };
};

describe('PlayerCommands', () => {
  it('queues one attack per target while held, and again after a release or a stop', () => {
    const { input, queued, tick, enqueueCommand } = setUp();
    input.isAttacking = true;
    input.aim = { x: 2, y: 2 };

    for (let count = 0; count < 5; count += 1) tick();
    expect(queued('attack-target')).toBe(1);
    expect(enqueueCommand).toHaveBeenCalledWith({
      type: 'attack-target',
      actorId: ACTOR,
      targetId: HOUSE_ENTITY,
    });
    input.isAttacking = false;
    tick();
    input.isAttacking = true;
    tick();
    expect(queued('attack-target')).toBe(2);
    // `stop` also drops the attack target, so the held button queues it once more after one.
    input.move = { x: 1, y: 0 };
    tick();
    input.move = { x: 0, y: 0 };
    tick();
    tick();
    expect(queued('attack-target')).toBe(3);
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
    tick([PLAYER, ENEMY]);
    input.triggered = [];
    input.isAttacking = true;
    tick([PLAYER, ENEMY]);
    tick([PLAYER, ENEMY]);

    expect(queued('cast-ability')).toBe(1);
    expect(queued('attack-target')).toBe(0);
    expect(enqueueCommand).toHaveBeenCalledWith({
      type: 'cast-ability',
      actorId: ACTOR,
      slot: 'ability-1',
      aim: { point: { x: 2, y: 2 }, targetId: null },
    });
    input.isAttacking = false;
    tick([PLAYER, ENEMY]);
    input.isAttacking = true;
    tick([PLAYER, ENEMY]);
    expect(queued('attack-target')).toBe(1);
  });

  it('in aim-then-click, a held attack pauses while a slot is selected and resumes on cancel', () => {
    const { input, casts, queued, tick } = setUp();
    casts.setCastMode('aim-then-click');
    input.aim = { x: 2, y: 2 };
    input.isAttacking = true;
    tick([PLAYER, ENEMY]);
    expect(queued('attack-target')).toBe(1);

    input.triggered = ['ability-2'];
    tick([PLAYER, ENEMY]);
    input.triggered = [];
    tick([PLAYER, ENEMY]);
    expect(queued('attack-target')).toBe(1);
    casts.cancel();
    tick([PLAYER, ENEMY]);

    expect(queued('attack-target')).toBe(2);
    expect(queued('cast-ability')).toBe(0);
  });

  it('queues no attack while the canvas gestures own the press (minimap or explorer)', () => {
    const { input, commands, queued, tick } = setUp();
    input.isAttacking = true;
    input.aim = { x: 2, y: 2 };

    commands.setPointerClaimed(true);
    tick();
    tick();
    expect(queued('attack-target')).toBe(0);
    commands.setPointerClaimed(false);
    tick();

    expect(queued('attack-target')).toBe(1);
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

  it('the held attack hits the enemy unit under the cursor, and the unit wins over the house', () => {
    const { input, queued, tick, enqueueCommand } = setUp();
    input.isAttacking = true;
    input.aim = { x: 2, y: 2 };

    tick([PLAYER, ENEMY]);
    tick([PLAYER, ENEMY]);

    expect(queued('attack-target')).toBe(1);
    expect(enqueueCommand).toHaveBeenCalledWith({
      type: 'attack-target',
      actorId: ACTOR,
      targetId: 'enemy-1',
    });
  });

  it('ignores allies and dead units: no unit hit, the held attack falls back to the house', () => {
    const { input, commands, enqueueCommand, tick } = setUp();
    const ally = unit('ally-1', 'light', 2, 2);
    const dead = { ...ENEMY, health: { current: 0, max: 10 } };

    expect(commands.attackUnitAt(ACTOR, { x: 2, y: 2 }, snapshotOf([PLAYER, ally, dead]))).toBe(
      false,
    );
    expect(enqueueCommand).not.toHaveBeenCalled();
    input.isAttacking = true;
    input.aim = { x: 2, y: 2 };
    tick([PLAYER, ally, dead]);

    expect(enqueueCommand.mock.calls.map(([command]) => command)).toEqual([
      { type: 'attack-target', actorId: ACTOR, targetId: HOUSE_ENTITY },
    ]);
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
