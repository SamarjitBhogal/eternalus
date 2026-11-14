import type { Command, EntitySnapshot, InputIntent, MapObject } from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { SeatCommands } from './SeatCommands';

const ACTOR = 'legend-1';

const unit = (
  id: string,
  team: 'light' | 'dark',
  x: number,
  y: number,
  hp = 10,
): EntitySnapshot => ({
  id,
  kind: 'minion',
  family: 'mob',
  definitionId: 'minion',
  team,
  transform: { x, y, radius: 1, facing: { x: 1, y: 0 } },
  health: { current: hp, max: 10 },
  progression: null,
  aether: null,
  area: null,
  capture: null,
});

const intent = (over: Partial<InputIntent>): InputIntent => ({
  move: { x: 0, y: 0 },
  aim: null,
  triggered: [],
  ...over,
});

function setup(mapObjects: readonly MapObject[] = []): {
  seat: SeatCommands;
  commands: Command[];
} {
  const commands: Command[] = [];
  return { seat: new SeatCommands(ACTOR, mapObjects, (c) => commands.push(c)), commands };
}

describe('SeatCommands', () => {
  it('queues move only when the axes change, then stop', () => {
    const { seat, commands } = setup();
    const snapshot = { entities: [] };
    seat.apply(intent({}), snapshot);
    seat.apply(intent({ move: { x: 1, y: 0 } }), snapshot);
    seat.apply(intent({ move: { x: 1, y: 0 } }), snapshot);
    seat.apply(intent({}), snapshot);
    expect(commands).toEqual([
      { type: 'move', actorId: ACTOR, direction: { x: 1, y: 0 } },
      { type: 'stop', actorId: ACTOR },
    ]);
  });

  it('attacks the living enemy under the aim once per target', () => {
    const { seat, commands } = setup();
    const snapshot = {
      entities: [
        unit(ACTOR, 'light', 0, 0),
        unit('ally', 'light', 5, 5),
        unit('foe', 'dark', 5, 5),
        unit('dead', 'dark', 9, 9, 0),
      ],
    };
    const attack = intent({ isAttacking: true, aim: { x: 5, y: 5 } });
    seat.apply(attack, snapshot);
    seat.apply(attack, snapshot);
    seat.apply(intent({ isAttacking: true, aim: { x: 9, y: 9 } }), snapshot);
    expect(commands).toEqual([{ type: 'attack-target', actorId: ACTOR, targetId: 'foe' }]);
  });

  it('attacks a map object when no unit is under the aim', () => {
    const house: MapObject = {
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
    const { seat, commands } = setup([house]);
    const snapshot = {
      entities: [],
      mapObjects: [
        {
          id: 'house',
          entityId: 'house-entity',
          health: { current: 5, max: 5 },
          isDestroyed: false,
        },
      ],
    };
    seat.apply(intent({ isAttacking: true, aim: { x: 2, y: 2 } }), snapshot);
    expect(commands).toEqual([{ type: 'attack-target', actorId: ACTOR, targetId: 'house-entity' }]);
  });

  it('does not attack without isAttacking, and re-queues a held attack after stop', () => {
    const { seat, commands } = setup();
    const snapshot = { entities: [unit('foe', 'dark', 5, 5)] };
    seat.apply(intent({ aim: { x: 5, y: 5 } }), snapshot);
    expect(commands).toEqual([]);
    const attack = intent({ isAttacking: true, aim: { x: 5, y: 5 } });
    seat.apply(intent({ ...attack, move: { x: 1, y: 0 } }), snapshot);
    seat.apply(attack, snapshot);
    seat.apply(attack, snapshot);
    expect(commands.map((c) => c.type)).toEqual(['attack-target', 'move', 'stop', 'attack-target']);
  });
});
