/**
 * Roving focus of the selection radio groups (WAI-ARIA APG radio group, HC-F1): its maths
 * and the key handler that moves the focus. The class cards and the Legend cards use the same
 * keys, so both steps import this one module.
 */

/** One radio as the roving maths sees it. */
type RovingItem = { readonly isAvailable: boolean; readonly isPicked: boolean };

/** Where the focus goes from the radio at `index` for `key`, or `null` for a key it ignores. */
type RovingMove = (index: number, key: string) => number | null;

/** A radio the focus can move to (an element on the page). */
type FocusableRadio = { focus(): void };

/** What the focus move reads from a key event on a radio; a React `KeyboardEvent` is one. */
type RovingKeyEvent = {
  readonly key: string;
  preventDefault(): void;
  readonly currentTarget: {
    readonly parentElement: {
      querySelectorAll(selectors: string): ArrayLike<FocusableRadio>;
    } | null;
  };
};

/** The radios of a group, among the parent's children. */
const RADIO_SELECTOR = '[role="radio"]';

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

/**
 * The key handler of a roving radio group's radios: `move` decides where the key takes the focus
 * from the radio at `index` (and picks there); when it goes somewhere, the key's default (a
 * scroll) is cancelled and that radio, found among its parent's radios, takes the focus.
 */
export function rovingKeyDown(move: RovingMove): (event: RovingKeyEvent, index: number) => void {
  return (event, index) => {
    const next = move(index, event.key);
    if (next === null) return;
    event.preventDefault();
    event.currentTarget.parentElement?.querySelectorAll(RADIO_SELECTOR)[next]?.focus();
  };
}
