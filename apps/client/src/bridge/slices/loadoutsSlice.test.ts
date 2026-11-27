import { describe, expect, it } from 'vitest';

import { loadoutsSlice, type LoadoutsSliceState } from './loadoutsSlice';

const STATE: LoadoutsSliceState = {
  options: {
    knight: {
      defaultWeaponId: 'raptor-talons',
      weapons: [
        { id: 'raptor-talons', displayName: 'Raptor Talons' },
        { id: 'wuuthrad', displayName: 'Wuuthrad' },
      ],
    },
  },
  saved: { knight: 'wuuthrad' },
  repaired: [],
};

const wrap = (loadouts: LoadoutsSliceState) => ({ loadouts });
const { selectChosenWeaponId, selectLegendOptions, selectWasRepaired } = loadoutsSlice.selectors;

describe('loadoutsSlice', () => {
  it('starts with no options, nothing saved and nothing repaired', () => {
    expect(loadoutsSlice.getInitialState()).toEqual({ options: {}, saved: {}, repaired: [] });
  });

  it('replaces the whole state when the game publishes it', () => {
    const next = loadoutsSlice.reducer(undefined, loadoutsSlice.actions.loadoutsChanged(STATE));
    expect(next).toEqual(STATE);
  });

  it('chooses the saved weapon, else the auto-build, else nothing, per Legend', () => {
    expect(selectChosenWeaponId(wrap(STATE), 'knight')).toBe('wuuthrad');
    expect(selectChosenWeaponId(wrap({ ...STATE, saved: {} }), 'knight')).toBe('raptor-talons');
    expect(selectChosenWeaponId(wrap(STATE), 'oracle')).toBeNull();
  });

  it('gives the options of a Legend, or null while they are unpublished', () => {
    expect(selectLegendOptions(wrap(STATE), 'knight')?.weapons).toHaveLength(2);
    expect(selectLegendOptions(wrap(STATE), 'knight')).toEqual(STATE.options.knight);
    expect(selectLegendOptions(wrap(STATE), 'oracle')).toBeNull();
  });

  it('says whether a Legend had its saved weapon repaired', () => {
    expect(selectWasRepaired(wrap({ ...STATE, repaired: ['knight'] }), 'knight')).toBe(true);
    expect(selectWasRepaired(wrap(STATE), 'knight')).toBe(false);
  });
});
