import { describe, expect, it } from 'vitest';

import type { RosterEntry } from '../events';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { createAppStore } from '../store';
import { selectAllyCountsByClass } from './selectAllyCountsByClass';

const ally = (
  legendId: string,
  classId: string,
  extra: Partial<RosterEntry> = {},
): RosterEntry => ({
  legendId,
  displayName: legendId,
  classId,
  specId: null,
  isBot: true,
  isPlayer: false,
  isRover: false,
  team: 'light',
  ...extra,
});

/** 62:125's counts: Legionnaire 2, Sentinel 3, Magus 2; the player (on warrior) is not counted. */
const ALLIES: readonly RosterEntry[] = [
  ally('player', 'warrior', { isPlayer: true, isBot: false, isRover: true }),
  ally('ally-2', 'warrior', { specId: 'knight' }),
  ally('ally-3', 'sentinel'),
  ally('ally-4', 'sentinel'),
  ally('ally-6', 'warrior'),
  ally('ally-7', 'magus', { specId: 'necromancer' }),
  ally('ally-8', 'sentinel'),
  ally('ally-10', 'magus', { specId: 'catalyst' }),
];

const storeWith = (allies: readonly RosterEntry[]) =>
  createAppStore({ matchSetup: { ...matchSetupSlice.getInitialState(), allies } });

describe('selectAllyCountsByClass', () => {
  it('counts the allied bots per class, the player excluded', () => {
    expect(selectAllyCountsByClass(storeWith(ALLIES).getState())).toEqual({
      warrior: 2,
      sentinel: 3,
      magus: 2,
    });
  });

  it('is empty without allies', () => {
    expect(selectAllyCountsByClass(storeWith([]).getState())).toEqual({});
  });

  it('keeps the same object after a countdown tick', () => {
    const store = storeWith(ALLIES);
    const before = selectAllyCountsByClass(store.getState());

    store.dispatch(matchSetupSlice.actions.setCountdown(41_000));

    expect(selectAllyCountsByClass(store.getState())).toBe(before);
  });
});
