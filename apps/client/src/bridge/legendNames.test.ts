import { describe, expect, it } from 'vitest';

import { legendNameFor } from './legendNames';

describe('legendNameFor', () => {
  const elarion = { light: 'Elarion', dark: 'Noirale' };

  it('gives the name the team knows the Legend by', () => {
    expect(legendNameFor(elarion, 'light')).toBe('Elarion');
    expect(legendNameFor(elarion, 'dark')).toBe('Noirale');
  });

  it('has no name for an unnamed Legend on either team, or without a team', () => {
    expect(legendNameFor(null, 'light')).toBeNull();
    expect(legendNameFor(null, 'dark')).toBeNull();
    expect(legendNameFor(elarion, null)).toBeNull();
  });
});
