import { describe, expect, it } from 'vitest';

import { unitClassOf } from './unitClasses';

describe('unitClassOf', () => {
  it('knows Legends and mobs by kind, and nothing else', () => {
    expect(unitClassOf('sentinel')).toBe('legend');
    expect(unitClassOf('medium-mob')).toBe('minion');
    expect(unitClassOf('stronghold')).toBeNull();
  });
});
