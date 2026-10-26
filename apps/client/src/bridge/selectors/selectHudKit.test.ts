import { describe, expect, it } from 'vitest';

import type { ClassHudDisplay } from '../catalogue.types';
import { classCardFixture, pickedClassState } from '../__fixtures__/catalogueFixtures';
import { selectHudKit } from './selectHudKit';

const WARRIOR_KIT: ClassHudDisplay = {
  emblemAssetId: 'warrior-hud-emblem',
  weapon: { displayName: null, iconAssetId: 'warrior-weapon-battle-axe' },
  slots: [],
};

const CLASSES = [
  classCardFixture({ classId: 'warrior', hud: WARRIOR_KIT }),
  classCardFixture({ classId: 'flying', status: 'locked' }),
];

const stateWith = (classId: string | null) => pickedClassState(CLASSES, classId);

describe('selectHudKit', () => {
  it('is the picked class kit, the stored reference', () => {
    expect(selectHudKit(stateWith('warrior'))).toBe(WARRIOR_KIT);
  });

  it('is null without a pick and for the locked class, which has no kit', () => {
    expect(selectHudKit(stateWith(null))).toBeNull();
    expect(selectHudKit(stateWith('flying'))).toBeNull();
  });
});
