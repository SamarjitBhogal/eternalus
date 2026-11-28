import { describe, expect, it } from 'vitest';

import { shownLegend } from './legendStepState';

/** Three cards by position; which one is picked is set per case. */
const cards = (pickedSpecId: string | null) =>
  ['first', 'second', 'third'].map((specId) => ({ specId, isPicked: specId === pickedSpecId }));

describe('shownLegend', () => {
  it('shows the preview, then the picked Legend, then the first card', () => {
    expect(shownLegend(cards('second'), 'third')?.specId).toBe('third');
    expect(shownLegend(cards('second'), null)?.specId).toBe('second');
    expect(shownLegend(cards(null), null)?.specId).toBe('first');
  });

  it('ignores a preview id the list does not have', () => {
    expect(shownLegend(cards('second'), 'unknown')?.specId).toBe('second');
    expect(shownLegend(cards(null), 'unknown')?.specId).toBe('first');
  });

  it('shows nothing for an empty list, previewed or not', () => {
    expect(shownLegend([], null)).toBeNull();
    expect(shownLegend([], 'first')).toBeNull();
  });

  it('returns the card itself, not a copy', () => {
    const legends = cards('second');

    expect(shownLegend(legends, null)).toBe(legends[1]);
  });
});
