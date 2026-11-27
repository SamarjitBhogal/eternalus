import type { BossPhaseId } from '@eternalus/core';

import type { BossPhaseCueLook } from './BossPhaseCueView.types';

/**
 * The look of each boss phase cue (DEC-417; Sam, answers-v103: "a large aura ring and the boss
 * glows purple with css particles or something that isnt overly heavy but is aesthetically
 * pleasing"). A phase without an entry has no cue. Sizes are diameters in boss radii, times are
 * ticks (30 a second), speeds are radians a tick. The purples match the Cathedral gem's glow
 * (`CathedralGemView.constants.ts`). TUNE: Sam gave no numbers; these are defaults taken in the
 * build.
 */
export const BOSS_PHASE_CUE_LOOKS: Readonly<Partial<Record<BossPhaseId, BossPhaseCueLook>>> = {
  hurt: {
    rings: {
      // ~1.5 s: each ring grows from the boss's own size to `endSize` and fades out.
      ticks: 45,
      startSize: 2,
      endSize: 14,
      delays: [0, 0.2],
      color: { rgb: '192,132,252', alpha: 0.9 },
    },
    glow: {
      size: 3.2,
      color: { rgb: '168,85,247', alpha: 0.35 },
      pulseAlpha: 0.1,
      pulseSpeed: 0.12,
      fadeInTicks: 45,
    },
    particles: {
      count: 6,
      orbitSize: 3.4,
      bobShare: 0.12,
      bobSpeed: 0.15,
      orbitSpeed: 0.06,
      size: 0.3,
      color: { rgb: '245,208,254', alpha: 0.9 },
    },
  },
};
