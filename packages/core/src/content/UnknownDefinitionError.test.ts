import { describe, expect, it } from 'vitest';

import { UnknownDefinitionError } from './UnknownDefinitionError';

describe('UnknownDefinitionError', () => {
  it('names the missing id in its message and keeps it for callers', () => {
    const error = new UnknownDefinitionError('no-such-unit');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('UnknownDefinitionError');
    expect(error.message).toBe('Unknown definition id "no-such-unit".');
    expect(error.definitionId).toBe('no-such-unit');
  });
});
