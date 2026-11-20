import { describe, expect, it } from 'vitest';

import { FAKE_STRIKE } from './__fixtures__/fakeAbilities';
import { RecordingEffect } from './__fixtures__/RecordingEffect';
import { ComposedAbility } from './ComposedAbility';
import { SelfTargeting } from './targeting/SelfTargeting';

describe('ComposedAbility', () => {
  it('takes its id from its definition and keeps what it was composed from', () => {
    const effect = new RecordingEffect('fake-strike');
    const steps = [{ effect, spec: { kind: 'fake-strike' }, delayTicks: 0 }];
    const targeting = { strategy: new SelfTargeting(), spec: { kind: 'self' } };

    const ability = new ComposedAbility(FAKE_STRIKE, steps, [], targeting, true);

    expect(ability).toMatchObject({
      id: 'fake-strike',
      steps,
      restrictions: [],
      targeting,
      isAvailable: true,
    });
    expect(ability.definition).toBe(FAKE_STRIKE);
  });
});
