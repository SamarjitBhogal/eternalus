import { type RefObject, useLayoutEffect, useState } from 'react';

/** A one-line text's fit: its design (Figma) size, the floor, and the width it must fit, in px. */
type FontFit = {
  readonly designSize: number;
  readonly minSize: number;
  readonly maxWidth: number;
};

/**
 * Fit-to-width for one line of `nowrap` text (OD-21e): given its `width` in layout px measured at
 * the font size `renderedSize`, the size at which it fits `maxWidth`, or `null` when it already
 * fits at `designSize` (the Figma size stays). Text width scales with font size, so the fitted
 * size is `designSize × maxWidth / designWidth`, rounded down to whole px so the line never ends
 * past `maxWidth`, and never below `minSize` (a longer text then overflows at `minSize`).
 */
export function fitFontSize(
  width: number,
  renderedSize: number,
  { designSize, minSize, maxWidth }: FontFit,
): number | null {
  const designWidth = (width * designSize) / renderedSize;
  if (designWidth <= maxWidth) return null;
  return Math.max(minSize, Math.floor((designSize * maxWidth) / designWidth));
}

/**
 * The font size that fits the element's one-line `text` into its `fit` (`fitFontSize`), or `null`
 * while it fits at the design size or is not measured yet: a server render and the first client
 * render draw the design size. Measured before paint on every `text` change, at the element's
 * computed size, so a title that follows a shrunk one is measured right. Layout px ignore the
 * stage's `transform`, so a window resize needs no new measurement.
 */
export function useFitFontSize(
  ref: RefObject<HTMLElement | null>,
  text: string,
  { designSize, minSize, maxWidth }: FontFit,
): number | null {
  const [size, setSize] = useState<number | null>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (element === null) return;
    const renderedSize = Number.parseFloat(getComputedStyle(element).fontSize);
    setSize(fitFontSize(element.scrollWidth, renderedSize, { designSize, minSize, maxWidth }));
  }, [ref, text, designSize, minSize, maxWidth]);
  return size;
}
