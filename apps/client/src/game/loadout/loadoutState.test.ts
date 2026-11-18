import { describe, expect, it } from 'vitest';

import type { LoadoutsSliceState } from '../../bridge/slices/loadoutsSlice';
import type { SavedLoadout } from './LoadoutController.types';
import { resolveSavedLoadouts } from './loadoutState';

const OPTIONS: LoadoutsSliceState['options'] = {
  warrior: {
    defaultWeaponId: 'raptor-talons',
    weapons: [
      { id: 'raptor-talons', displayName: 'Raptor Talons' },
      { id: 'wuuthrad', displayName: 'Wuuthrad' },
    ],
  },
};

const saved = (entries: Record<string, string>): ReadonlyMap<string, SavedLoadout> =>
  new Map(Object.entries(entries).map(([classId, id]) => [classId, { primaryWeaponId: id }]));

describe('resolveSavedLoadouts', () => {
  it('keeps a saved weapon the class still offers', () => {
    const resolved = resolveSavedLoadouts(OPTIONS, saved({ warrior: 'wuuthrad' }));
    expect(resolved).toEqual({ saved: { warrior: 'wuuthrad' }, repaired: [] });
  });

  it('repairs a weapon the class does not offer to the class default and reports the class', () => {
    const resolved = resolveSavedLoadouts(OPTIONS, saved({ warrior: 'magus-staff' }));
    expect(resolved.saved).toEqual({ warrior: 'raptor-talons' });
    expect(resolved.repaired).toEqual(['warrior']);
  });

  it('ignores a class content does not have', () => {
    const resolved = resolveSavedLoadouts(OPTIONS, saved({ 'old-class': 'x' }));
    expect(resolved).toEqual({ saved: {}, repaired: [] });
  });

  it('gives an empty result when nothing is saved', () => {
    expect(resolveSavedLoadouts(OPTIONS, new Map())).toEqual({ saved: {}, repaired: [] });
  });
});
