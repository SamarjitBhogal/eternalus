import type { VerdictLines } from './verdictLines.types';

/**
 * The verdict lines (architecture 12 §9). Only `objective-lost` ends a match today; `forfeit` and
 * `aborted` get lines with the conditions that produce them. `{name}` is the fallen side's
 * sovereign name (`content/sovereigns/sovereignDisplayNames.ts`): the enemy's on a victory, the
 * player's own on a defeat or a draw.
 */
export const VERDICT_LINES = {
  // TUNE: the owner's accepted placeholders (DEC-83 (2)); he may rewrite them at any time.
  'objective-lost': {
    victory: 'The enemy {name} has fallen.',
    defeat: 'Your {name} has fallen.',
    draw: 'Both {name}s fell in the same moment.',
  },
} as const satisfies VerdictLines;
