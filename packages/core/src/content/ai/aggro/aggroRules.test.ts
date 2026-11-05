import { describe, expect, it } from 'vitest';

import { MOB_DEFINITIONS } from '../../mobs/mobCatalogue';
import { GUARD_PLANS } from '../../structures/guardPlans';
import { AGGRO_RULES } from './aggroRules';

describe('AGGRO_RULES', () => {
  it('gives each guard plan’s mobs an acquisition radius of the plan’s leash less its post gap (AI56-F4)', () => {
    for (const plan of Object.values(GUARD_PLANS)) {
      for (const { mobId } of plan.table) {
        const profile = AGGRO_RULES[MOB_DEFINITIONS.get(mobId).aiProfile ?? ''];

        expect({ mobId, radius: profile?.acquisitionRadius }).toEqual({
          mobId,
          radius: plan.leashRadius - plan.postGap,
        });
      }
    }
  });
});
