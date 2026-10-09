import { describe, expect, it } from 'vitest';

import { SESSION_PHASES } from '../../bridge/events';
import { createDefaultSessionStates } from './defaultSessionStates';

describe('createDefaultSessionStates', () => {
  it('has one state per phase, each reporting its own phase', () => {
    const states = createDefaultSessionStates();
    expect(Object.keys(states).sort()).toEqual([...SESSION_PHASES].sort());
    for (const phase of SESSION_PHASES) expect(states[phase].phase).toBe(phase);
  });
});
