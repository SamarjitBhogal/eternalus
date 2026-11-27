import { describe, expect, it } from 'vitest';

import { loadoutsSlice, type LoadoutsSliceState } from '../slices/loadoutsSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { selectPlayerWeaponName } from './selectPlayerWeaponName';

const WARRIOR_WEAPONS = {
  defaultWeaponId: 'raptor-talons',
  weapons: [
    { id: 'raptor-talons', displayName: 'Raptor Talons' },
    { id: 'wuuthrad', displayName: 'Wuuthrad' },
  ],
};

/** Two Legends of one class: the Knight has Wuuthrad saved, the Paladin nothing. */
const PUBLISHED: LoadoutsSliceState = {
  options: { knight: WARRIOR_WEAPONS, paladin: WARRIOR_WEAPONS },
  saved: { knight: 'wuuthrad' },
  repaired: [],
};

const stateWith = (selection: { classId: string; specId: string | null } | null) => ({
  matchSetup: matchSetupSlice.reducer(undefined, matchSetupSlice.actions.select(selection)),
  loadouts: loadoutsSlice.reducer(undefined, loadoutsSlice.actions.loadoutsChanged(PUBLISHED)),
});

describe('selectPlayerWeaponName', () => {
  it('names the weapon saved for the picked Legend, not for its class (DEC-354 (1))', () => {
    expect(selectPlayerWeaponName(stateWith({ classId: 'warrior', specId: 'knight' }))).toBe(
      'Wuuthrad',
    );
  });

  it('names the auto-build weapon when nothing is saved for the Legend, as the match spawns it', () => {
    expect(selectPlayerWeaponName(stateWith({ classId: 'warrior', specId: 'paladin' }))).toBe(
      'Raptor Talons',
    );
  });

  it('names nothing before a Legend is picked', () => {
    expect(selectPlayerWeaponName(stateWith({ classId: 'warrior', specId: null }))).toBeNull();
    expect(selectPlayerWeaponName(stateWith(null))).toBeNull();
  });
});
