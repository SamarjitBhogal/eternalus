import type { AriaRole } from 'react';

import { STRINGS } from '../strings';

/** A meter value: `now` of `max` (min 0), with an optional spoken form. */
type MeterValue = {
  readonly now: number;
  readonly max: number;
  readonly text?: string | undefined;
};

/** The ARIA attributes of a HUD meter, spread onto its root element. */
type MeterAttributes = {
  readonly role: AriaRole;
  readonly 'aria-label': string;
  readonly 'aria-valuenow'?: number;
  readonly 'aria-valuemin'?: number;
  readonly 'aria-valuemax'?: number;
  readonly 'aria-valuetext'?: string | undefined;
};

/**
 * A meter with a value (`role="meter"` with now, min 0 and max), or, for `null`, an image named
 * "<label>: No data yet" with no value attributes: WAI-ARIA 1.2 requires a meter's
 * `aria-valuenow`, and a live value is often unknown (I-87, DEC-17).
 */
export function meterAttributes(label: string, value: MeterValue | null): MeterAttributes {
  if (value === null) {
    return { role: 'img', 'aria-label': `${label}: ${STRINGS.hud.noDataLabel}` };
  }
  return {
    role: 'meter',
    'aria-label': label,
    'aria-valuenow': value.now,
    'aria-valuemin': 0,
    'aria-valuemax': value.max,
    'aria-valuetext': value.text,
  };
}

/** `fraction` (0..1) as a whole percentage. */
export const percentOf = (fraction: number): number => Math.round(fraction * 100);

/** `value / max` clamped to 0..1, or `null` when either is unknown, `max` is not positive or the result is not finite. */
export function fractionOf(value: number | null, max: number | null): number | null {
  if (value === null || max === null || max <= 0) return null;
  const fraction = value / max;
  return Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : null;
}

/** The class names that are set, joined for `className`. */
export function classNames(...names: readonly (string | false | null | undefined)[]): string {
  return names.filter((name): name is string => typeof name === 'string' && name !== '').join(' ');
}
