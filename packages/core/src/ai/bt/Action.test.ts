import { describe, expect, it } from 'vitest';

import { Action } from './Action';

describe('Action', () => {
  it('acts on the context and reports what the act reports', () => {
    const done: string[] = [];
    const act = new Action<string[]>((into) => {
      into.push('acted');
      return 'running';
    });

    expect(act.tick(done)).toBe('running');
    expect(done).toEqual(['acted']);
  });
});
