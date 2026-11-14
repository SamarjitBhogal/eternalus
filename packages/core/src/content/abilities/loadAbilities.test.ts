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

  it('rejects broken content at load, naming every problem', () => {
    const broken = [
      { ...SLAM, id: 'Bad_Id', cooldownSeconds: -1 },
      {
        ...SHOCKWAVE,
        id: 'ghost',
        effects: [{ kind: 'debuff', statusId: 'frozen', shape: { kind: 'circle', radius: 0 } }],
      },
      { ...BLADE_RUNNER, id: 'lunge', targeting: null },
      { ...FURY, id: 'rage', aetherCost: 10 },
      { ...SLAM, id: 'idle', effects: [] },
      {
        ...SLAM,
        id: 'bad-numbers',
        effects: [
          {
            kind: 'damage',
            amount: 0,
            damageType: 'physical',
            shape: { kind: 'circle', radius: 1 },
            structureMultiplier: -1,
          },
          { kind: 'knockback', distance: 0, shape: { kind: 'circle', radius: 1 } },
          { kind: 'dash', distance: 0, durationSeconds: 0, onPath: [], onEnd: [] },
        ],
      },
    ] as const;

    expect(() => loadAbilities(30, broken)).toThrow(ContentValidationError);
    expect(() => loadAbilities(30, broken)).toThrow(
      /"Bad_Id": id must be kebab-case[\s\S]*"Bad_Id": cooldownSeconds must not be negative[\s\S]*"ghost": debuff status "frozen" is unknown[\s\S]*"ghost": circle radius must be positive[\s\S]*"lunge": an ability with effects needs targeting[\s\S]*"rage": an ultimate costs no aether[\s\S]*"idle": an ability with no effects has no targeting yet[\s\S]*"bad-numbers": damage amount must be positive[\s\S]*"bad-numbers": structureMultiplier must not be negative[\s\S]*"bad-numbers": knockback distance must be positive[\s\S]*"bad-numbers": dash distance must be positive[\s\S]*"bad-numbers": dash durationSeconds must be positive/,
    );
  });

  it('checks the steps inside a dash, and a debuff duration override', () => {
    const dash = {
      ...BLADE_RUNNER,
      id: 'lunge',
      effects: [
        {
          kind: 'dash',
          distance: 8,
          durationSeconds: 0.3,
          onPath: [
            {
              kind: 'debuff',
              statusId: 'frozen',
              durationSeconds: 0,
              shape: { kind: 'path', width: 0 },
            },
          ],
          onEnd: [],
        },
      ],
    } as const;

    expect(() => loadAbilities(30, [dash])).toThrow(
      /"lunge": debuff status "frozen" is unknown[\s\S]*"lunge": debuff durationSeconds must be positive[\s\S]*"lunge": path width must be positive/,
    );
  });
});
