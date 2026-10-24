import type { ReactElement } from 'react';

import { HUD_FILTER_LEVEL_NUMBER, LEVEL_NUMBER_EFFECTS } from './HudFilters.constants';
import styles from './HudFilters.module.css';

const { box, nearSigma, farSigma, noise, grainBins } = LEVEL_NUMBER_EFFECTS;

/** A blur's σ as fractions of the text box, so it scales with the HUD (`primitiveUnits`). */
const sigmaOf = (px: number): string => `${String(px / box.width)} ${String(px / box.height)}`;

/** The discrete alpha table that keeps Figma's grain bins (1) and drops the rest (0). */
const GRAIN_TABLE = Array.from({ length: grainBins.total }, (_, bin) =>
  bin >= grainBins.first && bin < grainBins.first + grainBins.count ? '1' : '0',
).join(' ');

/**
 * The HUD's one SVG filter, mounted once in the HUD: the level number's two drop shadows (the
 * glyphs knocked out of them) and its NOISE grain clipped to the glyphs, from the Figma export of
 * 65:656 with the `hardAlpha` ×127 matrices stripped (I-24) and its colours as token classes. The
 * grain cannot land on Figma's speckles in Chrome (S9 → CD-25, an approximation for the owner).
 */
export function HudFilters(): ReactElement {
  return (
    <svg className={styles.defs} width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <filter
          id={HUD_FILTER_LEVEL_NUMBER}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          primitiveUnits="objectBoundingBox"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceAlpha" stdDeviation={sigmaOf(nearSigma)} result="nearBlur" />
          <feFlood className={styles.floodNear} result="nearFlood" />
          <feComposite in="nearFlood" in2="nearBlur" operator="in" result="nearColour" />
          <feComposite in="nearColour" in2="SourceAlpha" operator="out" result="nearShadow" />
          <feGaussianBlur in="SourceAlpha" stdDeviation={sigmaOf(farSigma)} result="farBlur" />
          <feFlood className={styles.floodFar} result="farFlood" />
          <feComposite in="farFlood" in2="farBlur" operator="in" result="farColour" />
          <feComposite in="farColour" in2="SourceAlpha" operator="out" result="farShadow" />
          <feTurbulence
            type="fractalNoise"
            baseFrequency={noise.baseFrequency}
            numOctaves={noise.octaves}
            seed={noise.seed}
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix in="noise" type="luminanceToAlpha" result="noiseAlpha" />
          <feComponentTransfer in="noiseAlpha" result="grain">
            <feFuncA type="discrete" tableValues={GRAIN_TABLE} />
          </feComponentTransfer>
          <feComposite in="grain" in2="SourceGraphic" operator="in" result="grainClipped" />
          <feFlood className={styles.floodGrain} result="grainFlood" />
          <feComposite in="grainFlood" in2="grainClipped" operator="in" result="grainColour" />
          <feMerge>
            <feMergeNode in="nearShadow" />
            <feMergeNode in="farShadow" />
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="grainColour" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
