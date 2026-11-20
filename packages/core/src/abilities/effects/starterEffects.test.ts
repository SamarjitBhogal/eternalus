import { describe, expect, it } from 'vitest';
import { ContentCatalogue } from '../../content/ContentCatalogue';
import { fakeAbility } from '../__fixtures__/fakeAbilities';
import { createDefaultAbilityRegistry } from '../defaultAbilityRegistry';
import type { EffectStep } from '../AbilityEffect.types';

describe('starter effect content boundaries', () => {
  it.each([
    { kind: 'buff', statusId: 'missing' },
    { kind: 'blade', range: 0, speed: -1, damage: 0, statusIds: ['missing'] },
    {
      kind: 'beam',
      range: Number.NaN,
      width: 0,
      durationTicks: 0,
      extensionTicks: -1,
      pulseTicks: 0,
      damage: 0,
    },
    { kind: 'barrier', width: 0, thickness: -1, durationTicks: 0 },
    { kind: 'healing-field', radius: 0, durationTicks: 0, fractionPerSecond: -1 },
    {
      kind: 'rend',
      shape: { kind: 'cone', radius: 3, angleDegrees: 90 },
      damage: 0,
      pull: 0,
      multiplier: 0,
      threshold: 2,
      statusId: 'missing',
    },
    {
      kind: 'fury',
      statusId: 'missing',
      durationTicks: 0,
      dashDistance: 0,
      dashTicks: 0,
      internalCooldownTicks: 0,
    },
  ])('rejects malformed $kind effects before a match starts', (spec: EffectStep) => {
    const definitions = new ContentCatalogue([
      fakeAbility({ id: 'invalid-starter', effects: [spec] }),
    ]);
    expect(() => createDefaultAbilityRegistry(definitions)).toThrow('invalid-starter');
  });
});
