import type { Command, Simulation, Vec2 } from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import type { HudSlotId } from '../bridge/Binding.types';
import { AbilityCasts } from './AbilityCasts';
import type { CastInput } from './AbilityCasts.types';

const ACTOR = 'legend-1';
const HERE: Vec2 = { x: 5, y: 6 };
const CLICK: Vec2 = { x: 9, y: 2 };

const setUp = () => {
  const enqueueCommand = vi.fn<Simulation['enqueueCommand']>();
  const changes: (HudSlotId | null)[] = [];
  const casts = new AbilityCasts({ enqueueCommand }, (slot) => changes.push(slot));
  const queued = (): Command[] => enqueueCommand.mock.calls.map(([command]) => command);
  const press = (input: Partial<CastInput> & { readonly aim?: Vec2 | null } = {}): boolean =>
    casts.apply(ACTOR, { triggered: [], aim: HERE, isAttacking: false, ...input });
  return { casts, changes, queued, press };
};

const cast = (slot: HudSlotId, point: Vec2): Command => ({
  type: 'cast-ability',
  actorId: ACTOR,
  slot,
  aim: { point, targetId: null },
});

describe('AbilityCasts in quick cast', () => {
  it('queues a cast at once for each slot pressed, aimed at the pointer', () => {
    const { queued, press, casts } = setUp();

    press({ triggered: ['ability-2'] });
    press({ triggered: ['ability-1', 'gadget-1'], aim: CLICK });

    expect(queued()).toEqual([
      cast('ability-2', HERE),
      cast('ability-1', CLICK),
      cast('gadget-1', CLICK),
    ]);
    expect(casts.aimingSlot).toBeNull();
  });

  it('queues nothing while the pointer has no world point, and never takes the attack', () => {
    const { queued, press } = setUp();

    const isConsumed = press({ triggered: ['ability-1'], aim: null, isAttacking: true });

    expect(queued()).toEqual([]);
    expect(isConsumed).toBe(false);
  });
});

describe('AbilityCasts in aim-then-click', () => {
  const aimMode = () => {
    const parts = setUp();
    parts.casts.setCastMode('aim-then-click');
    return parts;
  };

  it('selects the slot on the key and casts only on the click, aimed at the click', () => {
    const { casts, changes, queued, press } = aimMode();

    press({ triggered: ['ability-1'] });
    expect(queued()).toEqual([]);
    expect(casts.aimingSlot).toBe('ability-1');

    press({ isAttacking: true, aim: CLICK });

    expect(queued()).toEqual([cast('ability-1', CLICK)]);
    expect(casts.aimingSlot).toBeNull();
    expect(changes).toEqual(['ability-1', null]);
  });

  it('selects a slot the same way for an ability centred on the caster (slot 3 and the ultimate)', () => {
    const { casts, press } = aimMode();

    press({ triggered: ['ability-3'] });
    expect(casts.aimingSlot).toBe('ability-3');
    press({ triggered: ['ability-4'] });
    expect(casts.aimingSlot).toBe('ability-4');
  });

  it('switches the selection when another slot key is pressed, and keeps it on the same key', () => {
    const { casts, changes, queued, press } = aimMode();

    press({ triggered: ['ability-1'] });
    press({ triggered: ['ability-2'] });
    press({ triggered: ['ability-2'] });
    press({ isAttacking: true, aim: CLICK });

    expect(queued()).toEqual([cast('ability-2', CLICK)]);
    expect(changes).toEqual(['ability-1', 'ability-2', null]);
    expect(casts.aimingSlot).toBeNull();
  });

  it('cancels the selection and queues nothing', () => {
    const { casts, changes, queued, press } = aimMode();

    press({ triggered: ['ability-1'] });
    casts.cancel();
    casts.cancel();
    press({ isAttacking: true });

    expect(queued()).toEqual([]);
    expect(changes).toEqual(['ability-1', null]);
  });

  it('keeps the selection when the click has no world point, and casts on the next one', () => {
    const { casts, queued, press } = aimMode();

    press({ triggered: ['ability-1'] });
    press({ isAttacking: true, aim: null });
    press();
    expect(casts.aimingSlot).toBe('ability-1');
    press({ isAttacking: true, aim: CLICK });

    expect(queued()).toEqual([cast('ability-1', CLICK)]);
  });

  it('takes the main button while aiming and until the confirming click is released', () => {
    const { press } = aimMode();

    expect(press()).toBe(false);
    expect(press({ triggered: ['ability-1'] })).toBe(true);
    expect(press({ isAttacking: true, aim: CLICK })).toBe(true);
    expect(press({ isAttacking: true, aim: CLICK })).toBe(true);
    expect(press()).toBe(false);
    expect(press({ isAttacking: true })).toBe(false);
  });

  it('does not cast on a button already held when the key was pressed', () => {
    const { casts, queued, press } = aimMode();

    press({ isAttacking: true });
    press({ isAttacking: true, triggered: ['ability-1'] });
    press({ isAttacking: true });

    expect(queued()).toEqual([]);
    expect(casts.aimingSlot).toBe('ability-1');
  });

  it('drops the selection when the mode changes back to quick cast', () => {
    const { casts, changes, press } = aimMode();

    press({ triggered: ['ability-1'] });
    casts.setCastMode('quick');

    expect(casts.aimingSlot).toBeNull();
    expect(changes).toEqual(['ability-1', null]);
  });
});

describe('AbilityCasts aim point', () => {
  it('keeps the latest pointer point for the range overlay, through ticks with no point', () => {
    const { casts, press } = setUp();
    expect(casts.aimPoint).toBeNull();

    press({ aim: CLICK });
    press({ aim: null });

    expect(casts.aimPoint).toEqual(CLICK);
  });
});
