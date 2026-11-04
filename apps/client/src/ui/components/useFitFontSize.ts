import { type RefObject, useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';

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
 * Measures `element`'s fit (`fitFontSize`) once, when the browser next lays it out, and passes it
 * to `onFit`; returns the cancel. A `ResizeObserver` reports the element after the frame's own
 * style and layout and before paint, so its computed font size and `scrollWidth` are read from a
 * finished layout. Reading them during a React commit instead forces a synchronous style and
 * layout of everything just mounted, inside the event handler that mounted it. The observer
 * disconnects before `onFit`, so the size change a fit causes is never reported back (no
 * ResizeObserver loop).
 */
export function measureFitAfterLayout(
  element: HTMLElement,
  fit: FontFit,
  onFit: (size: number | null) => void,
): () => void {
  const observer = new ResizeObserver(() => {
    observer.disconnect();
    const renderedSize = Number.parseFloat(getComputedStyle(element).fontSize);
    onFit(fitFontSize(element.scrollWidth, renderedSize, fit));
  });
  observer.observe(element);
  return () => {
    observer.disconnect();
  };
}

/**
 * The font size that fits the element's one-line `text` into its `fit` (`fitFontSize`), or `null`
 * while it fits at the design size or is not measured yet: a server render and the first client
 * render draw the design size. Measured on every `text` change in the same frame's layout, before
 * paint (`measureFitAfterLayout`, observed from the commit and applied with `flushSync`), at the
 * element's computed size, so a title that follows a shrunk one is measured right. Layout px
 * ignore the stage's `transform`, so a window resize needs no new measurement.
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
    return measureFitAfterLayout(element, { designSize, minSize, maxWidth }, (fitted) => {
      flushSync(() => {
        setSize(fitted);
      });
    });
  }, [ref, text, designSize, minSize, maxWidth]);
  return size;
}
