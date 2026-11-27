import { describe, expect, it } from 'vitest';

import { Footprint } from '../../components/Footprint';
import type { ProjectileSpec } from '../../content/abilities/AbilityDefinition.types';
import { PROJECTILES } from '../../content/projectiles/projectileCatalogue';
import { casterState } from '../__fixtures__/casterState';
import { castSteps } from '../__fixtures__/castSteps';
import { RecordingLauncher } from '../__fixtures__/RecordingLauncher';
import { ProjectileEffect } from './ProjectileEffect';

const HIT = { kind: 'hit' } as const;
/** Hamstring's step: the blade, 80 damage and 2 bleed stacks on the body it strikes. */
const SHOT: ProjectileSpec = {
  kind: 'projectile',
  projectileId: 'hamstring-blade',
  onHit: [
    { kind: 'damage', amount: 80, damageType: 'physical', shape: HIT, structureMultiplier: 0.3 },
    { kind: 'debuff', statusId: 'bleed', stacks: 2, shape: HIT },
  ],
};

describe('ProjectileEffect', () => {
  it('has the kind it is registered under', () => {
    expect(new ProjectileEffect(PROJECTILES).kind).toBe('projectile');
  });

  it('checks its own field: a known projectile', () => {
    const effect = new ProjectileEffect(PROJECTILES);

    expect(effect.validate(SHOT)).toEqual([]);
    expect(effect.validate({ ...SHOT, projectileId: 'no-such-shot' })).toEqual([
      'projectile "no-such-shot" is unknown',
    ]);
  });

  it('shows the line the shot flies (its range, its width), then its on-hit rows', () => {
    const nested = (step: { readonly kind: string }) => [
      { kind: `nested ${step.kind}`, shape: HIT },
    ];

    expect(new ProjectileEffect(PROJECTILES).describe(SHOT, nested)).toEqual([
      { kind: 'projectile', distance: 12, shape: { kind: 'path', width: 0.3 } },
      { kind: 'nested damage', shape: HIT },
      { kind: 'nested debuff', shape: HIT },
    ]);
  });

  it('launches the shot from the caster along the aim, carrying its on-hit steps, at no one when the aim point is on no walk-on outline', () => {
    const { state, caster } = casterState();
    const launcher = new RecordingLauncher();

    castSteps(state, caster.id, [SHOT], {
      aim: { x: 0, y: 5 },
      launcher,
      level: 3,
      scaling: { amount: { perLevel: 0.04 } },
    });

    expect(launcher.shots).toEqual([
      {
        projectileId: 'hamstring-blade',
        direction: { x: 0, y: 1 },
        payload: {
          ownerId: caster.id,
          team: 'light',
          source: { attackerId: caster.id, kind: 'ability', definitionId: 'test-cast' },
          targetId: null,
          impact: {
            kind: 'ability',
            abilityId: 'test-cast',
            slot: 'ability-1',
            onHit: SHOT.onHit,
            scaling: { amount: { perLevel: 0.04 } },
            casterLevel: 3,
          },
          origin: { x: 0, y: 0 },
        },
      },
    ]);
  });

  it('names the enemy walk-on outline under the aim point as its target (DEC-322 (1))', () => {
    const { state, factory, caster } = casterState();
    const floor = factory.create('light-mob', 'training-dummy', {
      position: { x: 30, y: 30 },
      team: 'dark',
    });
    floor.addComponent(
      new Footprint(
        [
          [
            { x: -4, y: 3 },
            { x: 4, y: 3 },
            { x: 4, y: 11 },
            { x: -4, y: 11 },
          ],
        ],
        { isWalkOn: true },
      ),
    );
    state.entities.add(floor);
    const launcher = new RecordingLauncher();

    castSteps(state, caster.id, [SHOT], { aim: { x: 0, y: 5 }, launcher });

    expect(launcher.shots.map((shot) => shot.payload.targetId)).toEqual([floor.id]);
  });
});
