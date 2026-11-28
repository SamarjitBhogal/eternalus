import { describe, expect, it } from 'vitest';

import { LastLegendHits } from './LastLegendHits';

describe('LastLegendHits (DEC-416)', () => {
  it("keeps each team's last Legend hitter, replacing that team's earlier one, and hashes in team order", () => {
    const hits = new LastLegendHits();
    hits.record('light', 'entity-1');
    hits.record('dark', 'entity-2');
    hits.record('light', 'entity-3');

    expect(hits.of('light')).toBe('entity-3');
    expect(hits.of('dark')).toBe('entity-2');
    expect(hits.of('neutral')).toBeUndefined();
    expect(hits.fields).toEqual(['dark', 'entity-2', 'light', 'entity-3']);
  });
});
