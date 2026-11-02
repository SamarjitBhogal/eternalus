import type {
  Command,
  InputIntent,
  MapObject,
  MapObjectSnapshot,
  Simulation,
  Vec2,
} from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import type { IntentSource } from './Match.types';
import { PlayerCommands } from './PlayerCommands';

const ACTOR = 'legend-1';
const HOUSE_ENTITY = 'house-entity';

/** An intent source the test steers by hand. */
class ScriptedIntent implements IntentSource {
  public move: Vec2 = { x: 0, y: 0 };

  public isAttacking = false;

  public aim: Vec2 | null = null;

  public read(): InputIntent {
    return { move: this.move, isAttacking: this.isAttacking, aim: this.aim, triggered: [] };
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

const setUp = () => {
  const input = new ScriptedIntent();
  const enqueueCommand = vi.fn<Simulation['enqueueCommand']>();
  const commands = new PlayerCommands(
    input,
    { enqueueCommand },
    { screenToWorld: (point) => point },
    [HOUSE],
  );
  const queued = (type: Command['type']): number =>
    enqueueCommand.mock.calls.filter(([command]) => command.type === type).length;
  const tick = (): boolean => {
    return commands.apply(ACTOR, HOUSE_STATES);
  };
  return { input, commands, enqueueCommand, queued, tick };
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
