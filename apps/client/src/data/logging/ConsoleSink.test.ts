import { makeLogRecord } from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import { ConsoleSink } from './ConsoleSink';

describe('ConsoleSink', () => {
  it('sends errors to console.error, warnings to console.warn and the rest to console.info', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const sink = new ConsoleSink();

    sink.write(makeLogRecord('FATAL', 'core.invariants', 'state broken', { tick: 7 }));
    sink.write(makeLogRecord('WARN', 'core.invariants', 'odd'));
    sink.write(makeLogRecord('DEBUG', 'client.match', 'frame'));

    expect(error).toHaveBeenCalledWith('[core.invariants] tick 7: state broken', expect.anything());
    expect(warn).toHaveBeenCalledWith('[core.invariants] tick -: odd', expect.anything());
    expect(info).toHaveBeenCalledWith('[client.match] tick -: frame', expect.anything());
  });
});
