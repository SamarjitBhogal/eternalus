import { type ReactElement, useId } from 'react';

import type { HudSlotId } from '../../bridge/Binding.types';
import type { HudSlotLook } from '../../bridge/selectors/selectHudSlotView';
import { SLOT_FRAMES, SLOT_GLOW_SIGMA, SLOT_STROKE } from './AbilitySlotFrame.constants';
import styles from './AbilitySlotFrame.module.css';

/** The cooldown fill: the whole box's red gradient, cut to the remaining share from the bottom. */
function cooldownShade(id: string, size: number, fraction: number): ReactElement {
  return (
    <>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={size} x2="0" y2="0">
          <stop offset="0" className={styles.shadeStrong} />
          <stop offset="1" className={styles.shadeSoft} />
        </linearGradient>
      </defs>
      <rect
        x="0"
        y={size * (1 - fraction)}
        width={size}
        height={size * fraction}
        fill={`url(#${id})`}
      />
    </>
  );
}

/** The ready look's fill and its amber outer and inner glows, one filter on the frame's shape. */
function readyGlow(id: string, size: number): ReactElement {
  return (
    <>
      <defs>
        <filter
          id={id}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceAlpha" stdDeviation={SLOT_GLOW_SIGMA} result="blur" />
          <feComposite in="blur" in2="SourceAlpha" operator="out" result="outer" />
          <feComposite in="SourceAlpha" in2="blur" operator="out" result="inner" />
          <feMerge result="glows">
            <feMergeNode in="outer" />
            <feMergeNode in="inner" />
          </feMerge>
          <feFlood className={styles.glowFlood} />
          <feComposite in2="glows" operator="in" />
        </filter>
      </defs>
      <rect className={styles.readyFill} width={size} height={size} />
      <rect width={size} height={size} filter={`url(#${id})`} />
    </>
  );
}

/**
 * A slot's frame as SVG geometry at its exact Figma size (the viewBox is the frame, so the
 * fractional 83.515 and 86.633 px edges stay exact and every length scales with the slot box):
 * ready = the 20 % dark fill, the amber outer and inner glows (one filter on the frame's shape,
 * like the Figma's) and the bright stroke above them; cooldown = the red gradient of the whole box
 * cut to the remaining share from the bottom (OD-9) under the grey stroke; otherwise the grey
 * stroke alone.
 */
export function AbilitySlotFrame({
  slot,
  look,
  cooldownFraction,
}: {
  readonly slot: HudSlotId;
  readonly look: HudSlotLook;
  /** 0..1 while cooling down, else `null`. */
  readonly cooldownFraction: number | null;
}): ReactElement {
  const id = useId();
  const { size, readyStroke } = SLOT_FRAMES[slot];
  const stroke = look === 'ready' ? readyStroke : SLOT_STROKE;
  const gradientId = `${id}cooldown`;
  const glowId = `${id}glow`;
  return (
    <svg
      className={styles.frame}
      viewBox={`0 0 ${String(size)} ${String(size)}`}
      aria-hidden="true"
      focusable="false"
    >
      {cooldownFraction !== null && cooldownShade(gradientId, size, cooldownFraction)}
      {look === 'ready' && readyGlow(glowId, size)}
      <rect
        className={look === 'ready' ? styles.strokeReady : styles.stroke}
        x={stroke / 2}
        y={stroke / 2}
        width={size - stroke}
        height={size - stroke}
        strokeWidth={stroke}
      />
    </svg>
  );
}
