import { describe, expect, it } from 'vitest';

import type { AbilityKit } from '../../abilities/AbilityDefinition.types';
import { MAGUS } from '../magus';
import { kitOf } from './kitOf';
import { ORACLE } from './oracle';

describe('kitOf', () => {
  const OWN: AbilityKit = { abilities: ['slam', 'shockwave', 'imbue'], ultimate: 'death-ray' };

  it("is the class's default kit for a spec with no kit of its own", () => {
    expect(kitOf({ ...ORACLE, kit: null }, MAGUS)).toBe(MAGUS.defaultKit);
  });

  it("is the spec's own kit when it has one", () => {
    expect(kitOf({ ...ORACLE, kit: OWN }, MAGUS)).toBe(OWN);
  });

  it("is the class's default kit when no spec is named", () => {
    expect(kitOf(null, MAGUS)).toBe(MAGUS.defaultKit);
  });
});
