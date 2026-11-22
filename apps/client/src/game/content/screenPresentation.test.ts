import { describe, expect, expectTypeOf, it } from 'vitest';

import type { UiEnhancementId } from '../../bridge/catalogue.types';
import { UI_ENHANCEMENT_IDS } from './screenPresentation';

describe('UI_ENHANCEMENT_IDS', () => {
  it('lists every UiEnhancementId once (DEC-286)', () => {
    expectTypeOf<(typeof UI_ENHANCEMENT_IDS)[number]>().toEqualTypeOf<UiEnhancementId>();
    expect(new Set(UI_ENHANCEMENT_IDS).size).toBe(UI_ENHANCEMENT_IDS.length);
  });
});
