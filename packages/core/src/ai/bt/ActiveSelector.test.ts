import { describe, expect, it } from 'vitest';

import { Action } from './Action';
import { ActiveSelector } from './ActiveSelector';
import { Condition } from './Condition';
import { Sequence } from './Sequence';

describe('ActiveSelector', () => {
  it('takes the first child that does not fail, re-checking from the top every tick', () => {
    const log: string[] = [];
    let isUrgent = false;
    const run = (name: string) =>
      new Action<string[]>((into) => {
        into.push(name);
        return 'running';
      });
    const root = new ActiveSelector<string[]>([
      new Sequence([new Condition(() => isUrgent), run('urgent')]),
      run('routine'),
    ]);

    expect(root.tick(log)).toBe('running');
    isUrgent = true;
    expect(root.tick(log)).toBe('running');
    expect(log).toEqual(['routine', 'urgent']);
    expect(new ActiveSelector<string[]>([new Condition(() => false)]).tick(log)).toBe('failure');
  });
});
