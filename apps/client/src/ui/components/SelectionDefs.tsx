import { Fragment, type ReactElement } from 'react';

import { ARCH_UNIT_PATH } from './archUnitPath';
import { GLOW_FILTERS, SELECTION_DEF_IDS, TEXT_GLOW_FILTERS } from './SelectionDefs.constants';
import styles from './SelectionDefs.module.css';
import type { GlowFilterDef, GlowFlood, TextGlowDef } from './SelectionDefs.types';

const FLOOD_CLASSES: Readonly<Record<GlowFlood, string | undefined>> = {
  frost: styles.floodFrost,
  'frost-soft': styles.floodFrostSoft,
  parchment: styles.floodParchment,
  azure: styles.floodAzure,
  'azure-strong': styles.floodAzureStrong,
  pale: styles.floodPale,
  sky: styles.floodSky,
  countdown: styles.floodCountdown,
};

/** The `result` name of the opaque flood over the user's box that a `'geometry'` knockout cuts by. */
const GEOMETRY = 'geometry';

/**
 * One glow: per shadow, the source alpha offset, blurred and flooded with its token (and, for a
 * knockout def, cut out under the source alpha or under an opaque flood over the user's whole
 * box); the shadows merged in order beneath the source, or alone for a shadow-only def
 * (`source: 'omitted'`). sRGB interpolation, as Figma blends; no `hardAlpha` colour matrix, which
 * turns blur tails opaque in Chrome.
 * The geometry flood's 0 %–100 % subregion is the user's border box (measured in Chrome: the
 * 58:273 ring box, the same as its absolute 0, 0, 309.4 × 55.25); only its alpha is read.
 */
function glowFilter({ id, region, shadows, knockout, source }: GlowFilterDef): ReactElement {
  const shown = (index: number): string =>
    `${knockout === 'none' ? 'shadow' : 'knockout'}${String(index)}`;
  return (
    <filter
      key={id}
      id={id}
      filterUnits="objectBoundingBox"
      x={region.x}
      y={region.y}
      width={region.width}
      height={region.height}
      colorInterpolationFilters="sRGB"
    >
      {knockout === 'geometry' && (
        <feFlood floodOpacity={1} x="0%" y="0%" width="100%" height="100%" result={GEOMETRY} />
      )}
      {shadows.map(({ dx, dy, sigma, flood }, index) => (
        <Fragment key={index}>
          <feOffset in="SourceAlpha" dx={dx} dy={dy} result={`offset${String(index)}`} />
          <feGaussianBlur
            in={`offset${String(index)}`}
            stdDeviation={sigma}
            result={`blur${String(index)}`}
          />
          <feFlood className={FLOOD_CLASSES[flood]} result={`flood${String(index)}`} />
          <feComposite
            in={`flood${String(index)}`}
            in2={`blur${String(index)}`}
            operator="in"
            result={`shadow${String(index)}`}
          />
          {knockout !== 'none' && (
            <feComposite
              in={`shadow${String(index)}`}
              in2={knockout === 'alpha' ? 'SourceAlpha' : GEOMETRY}
              operator="out"
              result={shown(index)}
            />
          )}
        </Fragment>
      ))}
      <feMerge>
        {shadows.map((_, index) => (
          <feMergeNode key={index} in={shown(index)} />
        ))}
        {source === 'merged' && <feMergeNode in="SourceGraphic" />}
      </feMerge>
    </filter>
  );
}

/**
 * A text glow: per shadow, the source alpha offset, blurred and (below full opacity) scaled to
 * its colour's alpha; the branches merged, then flooded once with the opaque `flood` (`in` reads
 * only alpha) beneath the source. No per-branch flood: in Chrome a flood composited into each
 * branch shifted the result by up to 5 code values from this, the measured construction.
 */
function textGlowFilter({ id, region, shadows, flood }: TextGlowDef): ReactElement {
  const shadowName = (index: number): string => `shadow${String(index)}`;
  return (
    <filter
      key={id}
      id={id}
      filterUnits="objectBoundingBox"
      x={region.x}
      y={region.y}
      width={region.width}
      height={region.height}
      colorInterpolationFilters="sRGB"
    >
      {shadows.map(({ dx, dy, sigma, opacity }, index) => (
        <Fragment key={index}>
          <feOffset in="SourceAlpha" dx={dx} dy={dy} result={`offset${String(index)}`} />
          <feGaussianBlur
            in={`offset${String(index)}`}
            stdDeviation={sigma}
            result={opacity === 1 ? shadowName(index) : `blur${String(index)}`}
          />
          {opacity !== 1 && (
            <feComponentTransfer in={`blur${String(index)}`} result={shadowName(index)}>
              <feFuncA type="linear" slope={opacity} />
            </feComponentTransfer>
          )}
        </Fragment>
      ))}
      <feMerge result="shadows">
        {shadows.map((_, index) => (
          <feMergeNode key={index} in={shadowName(index)} />
        ))}
      </feMerge>
      <feFlood className={FLOOD_CLASSES[flood]} result="glowFlood" />
      <feComposite in="glowFlood" in2="shadows" operator="in" result="glow" />
      <feMerge>
        <feMergeNode in="glow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}

/**
 * The selection screens' shared SVG defs, rendered once by the character-select shell: the arch
 * clip path, the multi-shadow glows (`GLOW_FILTERS`), the text glows (`TEXT_GLOW_FILTERS`) and the
 * GLASS rim gradient. Module CSS references them as `url(#sel-…)` (`SELECTION_DEF_IDS`); every
 * colour is a token set by a class.
 */
export function SelectionDefs(): ReactElement {
  return (
    <svg className={styles.defs} width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={SELECTION_DEF_IDS.archClip} clipPathUnits="objectBoundingBox">
          <path d={ARCH_UNIT_PATH} />
        </clipPath>
        {GLOW_FILTERS.map(glowFilter)}
        {TEXT_GLOW_FILTERS.map(textGlowFilter)}
        <linearGradient id={SELECTION_DEF_IDS.glassRim} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className={styles.rimLit} />
          <stop offset="0.5" className={styles.rimClear} />
        </linearGradient>
      </defs>
    </svg>
  );
}
