import { describe, expect, it } from 'vitest';

import { ContentValidationError } from '../ContentValidationError';
import { BLADE_RUNNER } from './bladeRunner';
import { FURY } from './fury';
import { loadAbilities } from './loadAbilities';
import { SHOCKWAVE } from './shockwave';
import { SLAM } from './slam';

describe('loadAbilities', () => {
  it('converts cooldowns, dash times and debuff durations from seconds to ticks', () => {
    const loaded = loadAbilities(30);

    expect(loaded.get('blade-runner').cooldownTicks).toBe(360);
    expect(loaded.get('blade-runner').effects[0]).toMatchObject({
      kind: 'dash',
      durationTicks: 9,
      onEnd: [{ kind: 'debuff', statusId: 'stun', durationTicks: 15 }],
    });
    expect(loaded.get('shockwave').effects[2]).toMatchObject({
      kind: 'debuff',
      statusId: 'concussion',
      durationTicks: 90,
    });
    expect(loaded.get('shockwave').effects[2]).not.toHaveProperty('durationSeconds');
  });

  it('keeps an ultimate at 0 ticks (never rounded up to one) and leaves other fields alone', () => {
    const loaded = loadAbilities(30);

    expect(loaded.get('fury').cooldownTicks).toBe(0);
    expect(loaded.get('slam').effects[0]).toMatchObject({ amount: 150, structureMultiplier: 2 });
    expect(loadAbilities(60).get('blade-runner').cooldownTicks).toBe(720);
  });

  it('leaves a debuff with no duration override without one, so the status keeps its own', () => {
    const noOverride = {
      ...SHOCKWAVE,
      effects: [{ kind: 'debuff', statusId: 'stun', shape: { kind: 'circle', radius: 1 } }],
    } as const;

    const loaded = loadAbilities(30, [noOverride]).get('shockwave').effects[0];

    expect(loaded).toEqual({
      kind: 'debuff',
      statusId: 'stun',
      shape: { kind: 'circle', radius: 1 },
    });
  });

  it('converts the times of any step kind, nested ones included, with no loader change', () => {
    const lance = {
      ...SLAM,
      id: 'lance',
      effects: [
        {
          kind: 'fake-lance',
          windupSeconds: 0.5,
          delaySeconds: 0,
          onHit: [{ kind: 'fake-burn', fadeSeconds: 2, shape: { kind: 'circle', radius: 1 } }],
        },
      ],
    } as const;

    const loaded = loadAbilities(30, [lance]).get('lance').effects[0];

    expect(loaded).toEqual({
      kind: 'fake-lance',
      windupTicks: 15,
      delayTicks: 0,
      onHit: [{ kind: 'fake-burn', fadeTicks: 60, shape: { kind: 'circle', radius: 1 } }],
    });
  });

  it('rejects broken content at load, naming every problem; step fields are left to the strategies', () => {
    const broken = [
      { ...SLAM, id: 'Bad_Id', cooldownSeconds: -1 },
      { ...BLADE_RUNNER, id: 'lunge', targeting: null },
      { ...FURY, id: 'rage', aetherCost: 10 },
      { ...SLAM, id: 'idle', effects: [] },
      {
        ...SHOCKWAVE,
        id: 'ghost',
        // An unknown status and a zero radius: `DebuffEffect` and `CircleShape` refuse them at boot.
        effects: [{ kind: 'debuff', statusId: 'frozen', shape: { kind: 'circle', radius: 0 } }],
      },
    ] as const;

    expect(() => loadAbilities(30, broken)).toThrow(ContentValidationError);
    expect(() => loadAbilities(30, broken)).toThrow(
      /^Ability "Bad_Id": id must be kebab-case\.\nAbility "Bad_Id": cooldownSeconds must not be negative\.\nAbility "lunge": an ability with effects needs targeting\.\nAbility "rage": an ultimate costs no aether[^\n]*\nAbility "idle": an ability with no effects has no targeting yet\.$/,
    );
  });

  it('refuses a negative time anywhere in a step, nested ones included, before it becomes ticks', () => {
    const dash = {
      ...BLADE_RUNNER,
      id: 'lunge',
      effects: [
        {
          kind: 'dash',
          distance: 8,
          durationSeconds: -0.3,
          onPath: [],
          onEnd: [
            {
              kind: 'debuff',
              statusId: 'stun',
              durationSeconds: -1,
              shape: { kind: 'circle', radius: 1 },
            },
          ],
        },
      ],
    } as const;

    expect(() => loadAbilities(30, [dash])).toThrow(
      /"lunge": dash durationSeconds must not be negative[\s\S]*"lunge": debuff durationSeconds must not be negative/,
    );
  });
});
