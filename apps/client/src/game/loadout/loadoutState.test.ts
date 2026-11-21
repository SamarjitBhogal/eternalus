import { loadDisplayContent, loadoutContentOf } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { SavedLoadout } from './LoadoutController.types';
import { resolveSavedLoadouts } from './loadoutState';

const CONTENT = loadoutContentOf(loadDisplayContent());

const saved = (entries: Record<string, string>): ReadonlyMap<string, SavedLoadout> =>
  new Map(Object.entries(entries).map(([classId, id]) => [classId, { primaryWeaponId: id }]));

describe('resolveSavedLoadouts', () => {
  it('keeps a saved loadout that passes the loadout rules', () => {
    const resolved = resolveSavedLoadouts(CONTENT, saved({ warrior: 'wuuthrad' }));
    expect(resolved).toEqual({ saved: { warrior: 'wuuthrad' }, repairs: new Map() });
  });

  it('repairs a weapon that no longer exists with the auto-build and names the slot', () => {
    const resolved = resolveSavedLoadouts(CONTENT, saved({ sentinel: 'renamed-axe' }));
    expect(resolved.saved).toEqual({ sentinel: 'wuuthrad' });
    expect(resolved.repairs).toEqual(new Map([['sentinel', ['primary-weapon']]]));
  });

  it('repairs a weapon the class may not carry the same way', () => {
    const resolved = resolveSavedLoadouts(CONTENT, saved({ warrior: 'magus-staff' }));
    expect(resolved.saved).toEqual({ warrior: 'raptor-talons' });
    expect([...resolved.repairs.keys()]).toEqual(['warrior']);
  });

  it('ignores a class content does not have', () => {
    expect(resolveSavedLoadouts(CONTENT, saved({ 'old-class': 'x' }))).toEqual({
      saved: {},
      repairs: new Map(),
    });
  });
});
