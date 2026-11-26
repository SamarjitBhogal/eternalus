import { loadDisplayContent, loadoutContentOf } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { legendLoadoutOptions } from './legendLoadoutOptions';
import type { SavedLoadout } from './LoadoutController.types';
import { resolveSavedLoadouts } from './loadoutState';

const DISPLAY = loadDisplayContent();
const CONTENT = loadoutContentOf(DISPLAY);
const OPTIONS = legendLoadoutOptions(DISPLAY);

const saved = (entries: Record<string, string>): ReadonlyMap<string, SavedLoadout> =>
  new Map(Object.entries(entries).map(([specId, id]) => [specId, { primaryWeaponId: id }]));

describe('resolveSavedLoadouts', () => {
  it('keeps a saved loadout that passes the loadout rules, per Legend', () => {
    const resolved = resolveSavedLoadouts(
      CONTENT,
      OPTIONS,
      saved({ knight: 'wuuthrad', paladin: 'raptor-talons' }),
    );
    expect(resolved).toEqual({
      saved: { knight: 'wuuthrad', paladin: 'raptor-talons' },
      repairs: new Map(),
    });
  });

  it('repairs a weapon that no longer exists with the auto-build and names the slot', () => {
    const resolved = resolveSavedLoadouts(CONTENT, OPTIONS, saved({ colossus: 'renamed-axe' }));
    expect(resolved.saved).toEqual({ colossus: 'wuuthrad' });
    expect(resolved.repairs).toEqual(new Map([['colossus', ['primary-weapon']]]));
  });

  it("repairs a weapon the Legend's class may not carry the same way", () => {
    const resolved = resolveSavedLoadouts(CONTENT, OPTIONS, saved({ knight: 'magus-staff' }));
    expect(resolved.saved).toEqual({ knight: 'raptor-talons' });
    expect([...resolved.repairs.keys()]).toEqual(['knight']);
  });

  it('ignores a Legend content does not have, and a record keyed by class', () => {
    expect(
      resolveSavedLoadouts(CONTENT, OPTIONS, saved({ 'old-legend': 'x', warrior: 'wuuthrad' })),
    ).toEqual({
      saved: {},
      repairs: new Map(),
    });
  });

  it('ignores a Legend whose class content does not have', () => {
    const options = {
      ...OPTIONS,
      'lost-legend': { classId: 'harbinger', defaultWeaponId: 'x', weapons: [] },
    };
    expect(resolveSavedLoadouts(CONTENT, options, saved({ 'lost-legend': 'wuuthrad' }))).toEqual({
      saved: {},
      repairs: new Map(),
    });
  });
});
