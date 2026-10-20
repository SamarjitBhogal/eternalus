import { describe, expect, it } from 'vitest';

import { ContentValidationError } from './ContentValidationError';

describe('ContentValidationError', () => {
  it('is an Error with its own name and the given message', () => {
    const error = new ContentValidationError('Invalid content: warrior: id must be kebab-case');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ContentValidationError');
    expect(error.message).toBe('Invalid content: warrior: id must be kebab-case');
  });
});
