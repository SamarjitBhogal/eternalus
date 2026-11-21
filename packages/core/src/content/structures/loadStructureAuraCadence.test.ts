import { describe, expect, it } from 'vitest';

import { ContentValidationError } from '../ContentValidationError';
import { loadStructureAuraCadence } from './loadStructureAuraCadence';

describe('loadStructureAuraCadence', () => {
  it('converts the period from seconds to ticks at load, never below one tick', () => {
    expect(loadStructureAuraCadence(30)).toEqual({ everyTicks: 15 });
    expect(loadStructureAuraCadence(10)).toEqual({ everyTicks: 5 });
    expect(loadStructureAuraCadence(30, { everySeconds: 0 })).toEqual({ everyTicks: 1 });
  });

  it('rejects a period that is negative or not a number', () => {
    expect(() => loadStructureAuraCadence(30, { everySeconds: -0.5 })).toThrow(
      ContentValidationError,
    );
    expect(() => loadStructureAuraCadence(30, { everySeconds: Number.NaN })).toThrow(
      'Invalid structure aura: everySeconds is NaN s',
    );
  });
});
