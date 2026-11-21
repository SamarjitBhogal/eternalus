import { describe, expect, it } from 'vitest';

import { loadoutsSlice, type LoadoutsSliceState } from './loadoutsSlice';

const STATE: LoadoutsSliceState = {
  options: {
    warrior: {
      defaultWeaponId: 'raptor-talons',
      weapons: [
        { id: 'raptor-talons', displayName: 'Raptor Talons' },
        { id: 'wuuthrad', displayName: 'Wuuthrad' },
      ],
    },
  },
  saved: { warrior: 'wuuthrad' },
  repaired: [],
};

const wrap = (loadouts: LoadoutsSliceState) => ({ loadouts });
const { selectChosenWeaponId, selectClassOptions, selectWasRepaired } = loadoutsSlice.selectors;

describe('loadoutsSlice', () => {
  it('starts with no options, nothing saved and nothing repaired', () => {
    expect(loadoutsSlice.getInitialState()).toEqual({ options: {}, saved: {}, repaired: [] });
  });

  it('replaces the whole state when the game publishes it', () => {
    const next = loadoutsSlice.reducer(undefined, loadoutsSlice.actions.loadoutsChanged(STATE));
    expect(next).toEqual(STATE);
  });

  it('chooses the saved weapon, else the class default, else nothing', () => {
    expect(selectChosenWeaponId(wrap(STATE), 'warrior')).toBe('wuuthrad');
    expect(selectChosenWeaponId(wrap({ ...STATE, saved: {} }), 'warrior')).toBe('raptor-talons');
    expect(selectChosenWeaponId(wrap(STATE), 'magus')).toBeNull();
  });

  it('gives the options of a class, or null while they are unpublished', () => {
    expect(selectClassOptions(wrap(STATE), 'warrior')?.weapons).toHaveLength(2);
    expect(selectClassOptions(wrap(STATE), 'magus')).toBeNull();
  });

  it('says whether a class had its saved weapon repaired', () => {
    expect(selectWasRepaired(wrap({ ...STATE, repaired: ['warrior'] }), 'warrior')).toBe(true);
    expect(selectWasRepaired(wrap(STATE), 'warrior')).toBe(false);
  });
});
