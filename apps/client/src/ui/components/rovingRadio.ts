/**
 * Roving-focus maths of the selection radio groups (WAI-ARIA APG radio group, I-14, I-23): the
 * class cards and the Legend cards use the same keys, so both steps import this one module.
 */

/** One radio as the roving maths sees it. */
type RovingItem = { readonly isAvailable: boolean; readonly isPicked: boolean };

/** Keys that move the focus forward or back by one, wrapping at the ends. */
const STEP_BY_KEY: Readonly<Record<string, -1 | 1>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

/**
 * The index the roving focus moves to from `index` for `key` among `count` radios: the arrows step
 * one and wrap (Right/Down forward, Left/Up back), Home goes to the first, End to the last. `null`
 * for any other key, and when there is no radio.
 */
export function nextRovingIndex(index: number, key: string, count: number): number | null {
  if (count <= 0) return null;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  const step = STEP_BY_KEY[key];
  if (step === undefined) return null;
  return (((index + step) % count) + count) % count;
}

/**
 * The radio that holds the group's single tab stop: the picked one, else the first available one,
 * else the first (an all-locked group stays reachable).
 */
export function tabbableRovingIndex(items: readonly RovingItem[]): number {
  const picked = items.findIndex((item) => item.isPicked);
  if (picked !== -1) return picked;
  return Math.max(
    0,
    items.findIndex((item) => item.isAvailable),
  );
}
