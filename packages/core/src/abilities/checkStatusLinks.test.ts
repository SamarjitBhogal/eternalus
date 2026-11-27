import { describe, expect, it } from 'vitest';

import type { AbilityDefinition } from '../content/abilities/AbilityDefinition.types';
import { loadAbilities } from '../content/abilities/loadAbilities';
import { ContentCatalogue } from '../content/ContentCatalogue';
import { ContentValidationError } from '../content/ContentValidationError';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { testAbilityRegistry } from './__fixtures__/fakeAbilities';
import { checkStatusLinks } from './checkStatusLinks';
import { createDefaultAbilityRegistry } from './defaultAbilityRegistry';

const STATUSES = loadStatusEffects(30, 2);
const FURY = STATUSES.get('fury');
const registry = createDefaultAbilityRegistry(loadAbilities(30), 30);
const KNOCKBACK_ON_HIT = { kind: 'knockback', distance: 1, shape: { kind: 'hit' } } as const;

describe('checkStatusLinks', () => {
  it('passes the shipped statuses: Fury’s knock-back and dash are known', () => {
    expect(() => {
      checkStatusLinks(registry, STATUSES.all());
    }).not.toThrow();
  });

  it('rejects a grant that names no ability, or one outside the granted slot kind', () => {
    const check = (grants: string) => () => {
      checkStatusLinks(registry, [{ ...FURY, grants }]);
    };

    expect(check('fury-dashh')).toThrow(ContentValidationError);
    expect(check('fury-dashh')).toThrow(
      'Status "fury" grants "fury-dashh", which names no ability.',
    );
    expect(check('fury')).toThrow(
      'Status "fury" grants "fury", which is not an ability of slot kind "granted".',
    );
  });

  it('rejects an onHit step with no strategy, or one its strategy refuses', () => {
    const noEffects = testAbilityRegistry([]);
    const shortPush = [{ ...FURY, onHit: [{ ...KNOCKBACK_ON_HIT, distance: 0 }] }];

    expect(() => {
      checkStatusLinks(noEffects, [FURY]);
    }).toThrow('Status "fury" onHit names effect "knockback" with no registered strategy');
    expect(() => {
      checkStatusLinks(registry, shortPush);
    }).toThrow('Status "fury" onHit: knockback distance must be positive.');
  });

  it('rejects a passive step that is not a buff, waits, has its own time, or puts on a status that ends', () => {
    const abilities = loadAbilities(30);
    const withNecromancy = (effects: AbilityDefinition['effects']) =>
      createDefaultAbilityRegistry(
        new ContentCatalogue([
          ...abilities.all().filter(({ id }) => id !== 'necromancy'),
          { ...abilities.get('necromancy'), effects },
        ]),
        30,
      );
    const check = (effects: AbilityDefinition['effects']) => () => {
      checkStatusLinks(withNecromancy(effects), STATUSES.all());
    };

    expect(check([{ kind: 'buff', statusId: 'fury' }])).toThrow(
      'Passive "necromancy" buffs "fury", which does not last until removed.',
    );
    expect(check([{ kind: 'buff', statusId: 'necromancy', durationTicks: 30 }])).toThrow(
      'Passive "necromancy" gives "necromancy" a time of its own; a passive\'s buffs have none.',
    );
    expect(check([{ kind: 'buff', statusId: 'necromancy', delayTicks: 3 }])).toThrow(
      'Passive "necromancy" buffs "necromancy" after a delay; a passive\'s steps run at once.',
    );
    expect(check([{ ...KNOCKBACK_ON_HIT, shape: { kind: 'circle', radius: 1 } }])).toThrow(
      'Passive "necromancy" has a "knockback" step; a passive\'s steps are buffs.',
    );
    expect(check([{ kind: 'buff', statusId: 'necromancy' }])).not.toThrow();
    expect(check([{ kind: 'buff', statusId: 'necromancy', delayTicks: 0 }])).not.toThrow();
  });

  it('names every problem of every status in one error', () => {
    const broken = [
      { ...FURY, grants: 'nothing' },
      { ...FURY, id: 'frenzy', onHit: [{ ...KNOCKBACK_ON_HIT, distance: 0 }] },
    ];

    expect(() => {
      checkStatusLinks(registry, broken);
    }).toThrow(/Status "fury" grants "nothing"[^]*Status "frenzy" onHit: knockback distance/);
  });
});
