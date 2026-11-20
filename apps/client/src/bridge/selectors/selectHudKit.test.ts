import { describe, expect, it } from 'vitest';

import type { ClassHudDisplay } from '../catalogue.types';
import {
  classCardFixture,
  pickedClassState,
  specCardFixture,
} from '../__fixtures__/catalogueFixtures';
import { selectHudKit } from './selectHudKit';

const WARRIOR_KIT: ClassHudDisplay = {
  emblemAssetId: 'warrior-hud-emblem',
  weapon: { displayName: null, iconAssetId: 'warrior-weapon-battle-axe' },
  slots: [],
};

const AXE: ClassHudDisplay['weapon'] = { displayName: null, iconAssetId: 'battle-axe' };

const CLASSES = [
  classCardFixture({
    classId: 'warrior',
    hud: WARRIOR_KIT,
    specs: [
      specCardFixture({ specId: 'knight' }),
      specCardFixture({ specId: 'juggernaut', hudWeapon: AXE }),
    ],
  }),
  classCardFixture({ classId: 'harbinger', status: 'locked' }),
];

const stateWith = (classId: string | null, specId: string | null = null) =>
  pickedClassState(CLASSES, classId, specId);

describe('selectHudKit', () => {
  it('is the picked class kit, the stored reference', () => {
    expect(selectHudKit(stateWith('warrior'))).toBe(WARRIOR_KIT);
  });

  it('is null without a pick and for the locked class, which has no kit', () => {
    expect(selectHudKit(stateWith(null))).toBeNull();
    expect(selectHudKit(stateWith('harbinger'))).toBeNull();
  });

  it("shows the picked Legend's own weapon art in place of the class kit's weapon (DEC-114)", () => {
    expect(selectHudKit(stateWith('warrior', 'juggernaut'))).toEqual({
      ...WARRIOR_KIT,
      weapon: AXE,
    });
    expect(selectHudKit(stateWith('warrior', 'knight'))).toBe(WARRIOR_KIT);
  });

  it('returns the same object for the same pick across store updates', () => {
    expect(selectHudKit(stateWith('warrior', 'juggernaut'))).toBe(
      selectHudKit(stateWith('warrior', 'juggernaut')),
    );
  });

  it("names the slots after the picked Legend's kit, keeping the class's icons (DEC-199)", () => {
    const kitRow = (slot: 'ability-1' | 'ability-4', displayName: string) => ({
      slot: slot === 'ability-4' ? ('ultimate' as const) : slot,
      displayName,
      iconAssetId: null,
      kit: {
        slot,
        abilityId: displayName.toLowerCase(),
        displayName,
        description: '',
        cost: { kind: 'charge' as const },
        cooldownSeconds: null,
        isAvailable: true,
      },
    });
    const classes = [
      classCardFixture({
        classId: 'warrior',
        hud: {
          ...WARRIOR_KIT,
          slots: [
            { slot: 'ability-1', displayName: null, iconAssetId: 'icon-1' },
            { slot: 'ability-2', displayName: 'Old', iconAssetId: 'icon-2' },
            { slot: 'ability-4', displayName: null, iconAssetId: 'icon-4' },
          ],
        },
        specs: [
          specCardFixture({
            specId: 'knight',
            details: [kitRow('ability-4', 'Fury'), kitRow('ability-1', 'Blade Runner')],
          }),
        ],
      }),
    ];
    expect(selectHudKit(pickedClassState(classes, 'warrior', 'knight'))?.slots).toEqual([
      { slot: 'ability-1', displayName: 'Blade Runner', iconAssetId: 'icon-1' },
      { slot: 'ability-2', displayName: 'Old', iconAssetId: 'icon-2' },
      { slot: 'ability-4', displayName: 'Fury', iconAssetId: 'icon-4' },
    ]);
  });
});
