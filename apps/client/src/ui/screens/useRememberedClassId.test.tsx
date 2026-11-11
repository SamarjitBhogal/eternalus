import { type ReactElement, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { LegendClassId } from '../../bridge/domain.types';
import { rememberedClassId, useRememberedClassId } from './useRememberedClassId';

/**
 * What the hook returns while the session's class goes through `session`, one render each. A
 * server render has no second commit, so the probe steps itself with a render-phase update
 * (React re-renders it at once with its state kept), which is how the shell sees each change.
 */
function rememberedThrough(session: readonly (LegendClassId | null)[]): (LegendClassId | null)[] {
  const remembered: (LegendClassId | null)[] = [];
  function Probe(): ReactElement {
    const [at, setAt] = useState(0);
    remembered[at] = useRememberedClassId(session[at] ?? null);
    if (at < session.length - 1) setAt(at + 1);
    return <span />;
  }
  renderToStaticMarkup(<Probe />);
  return remembered;
}

describe("rememberedClassId (the shell's Back memory, CD-11)", () => {
  it('remembers nothing on first entry, then remembers a pick', () => {
    expect(rememberedClassId(null, null)).toBeNull();
    expect(rememberedClassId(null, 'magus')).toBe('magus');
  });

  it('keeps the last class through Back (the session clears its pick to null)', () => {
    expect(rememberedClassId('magus', null)).toBe('magus');
  });

  it('replaces the remembered class with a new pick', () => {
    expect(rememberedClassId('magus', 'sentinel')).toBe('sentinel');
  });

  it('follows the session through pick, Back, pick, Back', () => {
    const session = ['magus', null, 'sentinel', null] as const;
    const remembered: (string | null)[] = [];
    let last: string | null = null;
    for (const classId of session) {
      last = rememberedClassId(last, classId);
      remembered.push(last);
    }

    expect(remembered).toEqual(['magus', 'magus', 'sentinel', 'sentinel']);
  });
});

describe('useRememberedClassId', () => {
  it("is the session's class on mount, and nothing on first entry", () => {
    expect(rememberedThrough(['magus'])).toEqual(['magus']);
    expect(rememberedThrough([null])).toEqual([null]);
  });

  it('keeps the class across renders through pick, Back, pick, Back', () => {
    expect(rememberedThrough([null, 'magus', null, 'sentinel', null])).toEqual([
      null,
      'magus',
      'magus',
      'sentinel',
      'sentinel',
    ]);
  });
});
