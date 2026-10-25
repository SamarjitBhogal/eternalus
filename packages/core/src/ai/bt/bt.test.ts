import { describe, expect, it } from 'vitest';

import { Action } from './Action';
import { ActiveSelector } from './ActiveSelector';
import type { BtStatus } from './BtNode.types';
import { Condition } from './Condition';
import { Sequence } from './Sequence';

type Log = string[];
const act = (name: string, status: BtStatus) =>
  new Action<Log>((log) => {
    log.push(name);
    return status;
  });

describe('behaviour-tree nodes', () => {
  it('Condition reports its test; Sequence stops at the first child that does not succeed', () => {
    const log: Log = [];
    const sequence = new Sequence<Log>([
      new Condition(() => true),
      act('a', 'running'),
      act('b', 'success'),
    ]);

    expect(sequence.tick(log)).toBe('running');
    expect(log).toEqual(['a']);
    expect(new Sequence<Log>([new Condition(() => false), act('c', 'success')]).tick(log)).toBe(
      'failure',
    );
    expect(new Sequence<Log>([act('d', 'success')]).tick(log)).toBe('success');
    expect(log).toEqual(['a', 'd']);
  });

  it('ActiveSelector takes the first child that does not fail, re-checking from the top', () => {
    const log: Log = [];
    let isUrgent = false;
    const root = new ActiveSelector<Log>([
      new Sequence([new Condition(() => isUrgent), act('urgent', 'running')]),
      act('routine', 'running'),
    ]);

    expect(root.tick(log)).toBe('running');
    isUrgent = true;
    expect(root.tick(log)).toBe('running');
    expect(log).toEqual(['routine', 'urgent']);
    expect(new ActiveSelector<Log>([act('x', 'failure')]).tick(log)).toBe('failure');
  });
});
