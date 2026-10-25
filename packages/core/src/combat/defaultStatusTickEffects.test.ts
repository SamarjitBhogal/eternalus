import { describe, expect, it } from 'vitest';

import { DamageStatusTick } from './DamageStatusTick';
import { createDefaultStatusTickEffects } from './defaultStatusTickEffects';

describe('createDefaultStatusTickEffects', () => {
  it('maps every tick kind to its strategy', () => {
    expect(createDefaultStatusTickEffects().damage).toBeInstanceOf(DamageStatusTick);
  });
});
