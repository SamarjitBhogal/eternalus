import { describe, expect, it } from 'vitest';

import { loadoutsSlice, type LoadoutsSliceState } from '../slices/loadoutsSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { selectPlayerWeaponName } from './selectPlayerWeaponName';

const PUBLISHED: LoadoutsSliceState = {
  options: {
    warrior: {
      defaultWeaponId: 'raptor-talons',
      weapons: [
        { id: 'raptor-talons', displayName: 'Raptor Talons' },
        { id: 'wuuthrad', displayName: 'Wuuthrad' },
      ],
    },
  },
  saved: {},
  repaired: [],
};

const stateWith = (classId: string | null, loadouts: LoadoutsSliceState = PUBLISHED) => ({
  matchSetup: matchSetupSlice.reducer(
    undefined,
    matchSetupSlice.actions.select(classId === null ? null : { classId, specId: null }),
  ),
  loadouts: loadoutsSlice.reducer(undefined, loadoutsSlice.actions.loadoutsChanged(loadouts)),
});

describe('selectPlayerWeaponName', () => {
  it('names the weapon saved for the picked class', () => {
    expect(
      selectPlayerWeaponName(
        stateWith('warrior', { ...PUBLISHED, saved: { warrior: 'wuuthrad' } }),
      ),
    ).toBe('Wuuthrad');
  });

  it("names the class's auto-build weapon when nothing is saved, as the match spawns it", () => {
    expect(selectPlayerWeaponName(stateWith('warrior'))).toBe('Raptor Talons');
    expect(selectPlayerWeaponName(stateWith(null))).toBeNull();
  });
});
