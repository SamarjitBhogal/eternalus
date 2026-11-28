/**
 * Test support: each shipped Legend class's sprite width by class id (core content `spriteWidth`,
 * DEC-424), as `main.tsx` passes it to the match factory. Imported only by tests.
 */
import { loadDisplayContent } from '@eternalus/core';

import { legendSpriteWidthsOf } from '../legendSpriteWidthsOf';

export const SHIPPED_SPRITE_WIDTHS = legendSpriteWidthsOf(loadDisplayContent().legends);
