import type { Command, InputIntent } from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { SeatCommands } from './SeatCommands';

const ACTOR = 'legend-1';

const intent = (over: Partial<InputIntent>): InputIntent => ({
  move: { x: 0, y: 0 },
  aim: null,
  triggered: [],
  ...over,
});

function setup(): { seat: SeatCommands; commands: Command[] } {
  const commands: Command[] = [];
  return { seat: new SeatCommands(ACTOR, (c) => commands.push(c)), commands };
}

const AIM = { x: 5, y: 5 };

describe('SeatCommands', () => {
  it('queues move only when the axes change, then stop', () => {
    const { seat, commands } = setup();
    seat.apply(intent({}));
    seat.apply(intent({ move: { x: 1, y: 0 } }));
    seat.apply(intent({ move: { x: 1, y: 0 } }));
    seat.apply(intent({}));
    expect(commands).toEqual([
      { type: 'move', actorId: ACTOR, direction: { x: 1, y: 0 } },
      { type: 'stop', actorId: ACTOR },
    ]);
  });

  it('sends attack-aim when the held point changes, not when it stays', () => {
    const { seat, commands } = setup();
    seat.apply(intent({ isAttacking: true, aim: AIM }));
    seat.apply(intent({ isAttacking: true, aim: { ...AIM } }));
    seat.apply(intent({ isAttacking: true, aim: { x: 9, y: 9 } }));
    expect(commands).toEqual([
      { type: 'attack-aim', actorId: ACTOR, aim: AIM },
      { type: 'attack-aim', actorId: ACTOR, aim: { x: 9, y: 9 } },
    ]);
  });

  it('sends one attack-aim with a null aim on release, and nothing while up', () => {
    const { seat, commands } = setup();
    seat.apply(intent({ aim: AIM }));
    expect(commands).toEqual([]);
    seat.apply(intent({ isAttacking: true, aim: AIM }));
    seat.apply(intent({ aim: AIM }));
    seat.apply(intent({ aim: AIM }));
    expect(commands).toEqual([
      { type: 'attack-aim', actorId: ACTOR, aim: AIM },
      { type: 'attack-aim', actorId: ACTOR, aim: null },
    ]);
  });

  it('sends attack-aim again after a stop while the button is still held', () => {
    const { seat, commands } = setup();
    const attack = intent({ isAttacking: true, aim: AIM });
    seat.apply(intent({ ...attack, move: { x: 1, y: 0 } }));
    seat.apply(attack);
    seat.apply(attack);
    expect(commands.map((c) => c.type)).toEqual(['attack-aim', 'move', 'stop', 'attack-aim']);
  });

  it('aims in melee mode while the melee key is held, and re-sends on a change of mode (DEC-308)', () => {
    const { seat, commands } = setup();
    seat.apply(intent({ isAttacking: true, aim: AIM }));
    seat.apply(intent({ isAttacking: true, isMeleeAttacking: true, aim: AIM }));
    seat.apply(intent({ isAttacking: true, isMeleeAttacking: true, aim: AIM }));
    seat.apply(intent({ isMeleeAttacking: true, aim: AIM }));
    seat.apply(intent({ isAttacking: true, aim: AIM }));
    expect(commands).toEqual([
      { type: 'attack-aim', actorId: ACTOR, aim: AIM },
      { type: 'attack-aim', actorId: ACTOR, aim: AIM, mode: 'melee' },
      { type: 'attack-aim', actorId: ACTOR, aim: AIM },
    ]);
  });

  it('queues a held movement and attack again after reset', () => {
    const { seat, commands } = setup();
    const held = intent({ move: { x: 1, y: 0 }, isAttacking: true, aim: AIM });
    seat.apply(held);
    seat.reset();
    seat.apply(held);
    expect(commands.map((c) => c.type)).toEqual(['attack-aim', 'move', 'attack-aim', 'move']);
  });
});
