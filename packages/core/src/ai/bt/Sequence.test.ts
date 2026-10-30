import { describe, expect, it } from 'vitest';

import { Action } from './Action';
import { Condition } from './Condition';
import { Sequence } from './Sequence';

describe('Sequence', () => {
  it('runs its children while they succeed and reports the first that does not', () => {
    const log: string[] = [];
    const step = (name: string, status: 'success' | 'running') =>
      new Action<string[]>((into) => {
        into.push(name);
        return status;
      });

    expect(new Sequence([step('a', 'running'), step('b', 'success')]).tick(log)).toBe('running');
    expect(
      new Sequence<string[]>([new Condition(() => false), step('c', 'success')]).tick(log),
    ).toBe('failure');
    expect(new Sequence([step('d', 'success')]).tick(log)).toBe('success');
    expect(log).toEqual(['a', 'd']);
  });
});
