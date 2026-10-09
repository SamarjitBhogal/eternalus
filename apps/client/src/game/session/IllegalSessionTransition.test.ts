import { describe, expect, it } from 'vitest';

import { IllegalSessionTransition } from './IllegalSessionTransition';

describe('IllegalSessionTransition', () => {
  it('is a named Error that states both phases', () => {
    const error = new IllegalSessionTransition('menu', 'match');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('IllegalSessionTransition');
    expect(error.message).toBe('Illegal session transition: menu → match');
  });
});
