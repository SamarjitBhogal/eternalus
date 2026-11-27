import { describe, expect, it } from 'vitest';

import { MAGUS } from '../magus';
import { SENTINEL } from '../sentinel';
import { COLOSSUS } from './colossus';
import { ORACLE } from './oracle';
import { passiveOf } from './passiveOf';

describe('passiveOf', () => {
  it("is the class's default passive for a spec with no passive of its own", () => {
    expect(passiveOf(COLOSSUS, SENTINEL)).toBe('wrecking-run');
  });

  it("is the spec's own passive when it names one", () => {
    expect(passiveOf({ ...COLOSSUS, passiveId: 'necromancy' }, SENTINEL)).toBe('necromancy');
    expect(passiveOf(ORACLE, MAGUS)).toBe('erudition');
  });

  it("is the class's default passive when no spec is named, and null when the class has none", () => {
    expect(passiveOf(null, SENTINEL)).toBe('wrecking-run');
    expect(passiveOf(null, MAGUS)).toBeNull();
  });
});
