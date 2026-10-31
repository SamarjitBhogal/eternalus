import { describe, expect, it } from 'vitest';

import type { SettingsDtoV1 } from './SettingsDto';
import { validateSettingsDto } from './SettingsDto';

const KNOWN_ACTIONS = new Set(['move-up', 'attack']);

const VALID: SettingsDtoV1 = {
  schemaVersion: 1,
  profileId: 'local',
  bindings: [
    { action: 'move-up', chords: [{ device: 'keyboard', code: 'ArrowUp', label: '↑' }] },
    { action: 'attack', chords: [{ device: 'mouse', code: '0', label: 'LMB' }] },
  ],
  audio: { master: 1, music: 0.5, effects: 0 },
  video: { fullscreen: false, renderScale: 1 },
  accessibility: { reduceMotion: true, colourBlindMode: false },
};

function reasonFor(value: unknown): string | null {
  const checked = validateSettingsDto(value, KNOWN_ACTIONS);
  return checked.ok ? null : checked.reason;
}

describe('validateSettingsDto', () => {
  it('accepts a well-formed record', () => {
    expect(validateSettingsDto(VALID, KNOWN_ACTIONS)).toEqual({ ok: true, dto: VALID });
  });

  it('accepts a keyboard chord with modifier keys (DEC-105)', () => {
    const chord = {
      device: 'keyboard',
      code: 'F3',
      label: 'Ctrl+Shift+F3',
      modifiers: ['Control', 'Shift'],
    } as const;
    const record = { ...VALID, bindings: [{ action: 'attack', chords: [chord] }] };
    expect(validateSettingsDto(record, KNOWN_ACTIONS)).toEqual({ ok: true, dto: record });
  });

  it.each([
    ['a non-object', 'settings', 'not an object'],
    ['a future version', { ...VALID, schemaVersion: 2 }, 'schemaVersion: unsupported version 2'],
    ['a missing profile id', { ...VALID, profileId: 7 }, 'profileId: not a string'],
    ['bindings that are not a list', { ...VALID, bindings: {} }, 'bindings: not an array'],
    [
      'a binding that is not an object',
      { ...VALID, bindings: [null] },
      'bindings[0]: not a binding',
    ],
    [
      'an unknown action',
      { ...VALID, bindings: [{ action: 'fly', chords: [] }] },
      'bindings[0].action: unknown action "fly"',
    ],
    [
      'a chord from an unknown device',
      {
        ...VALID,
        bindings: [{ action: 'attack', chords: [{ device: 'pen', code: '0', label: '' }] }],
      },
      'bindings[0].chords: invalid chord',
    ],
    [
      'a chord with an unknown modifier',
      {
        ...VALID,
        bindings: [
          {
            action: 'attack',
            chords: [{ device: 'keyboard', code: 'F3', label: 'F3', modifiers: ['Hyper'] }],
          },
        ],
      },
      'bindings[0].chords: invalid chord',
    ],
    [
      'a chord whose modifiers are not a list',
      {
        ...VALID,
        bindings: [
          {
            action: 'attack',
            chords: [{ device: 'keyboard', code: 'F3', label: 'F3', modifiers: 'Shift' }],
          },
        ],
      },
      'bindings[0].chords: invalid chord',
    ],
    [
      'a volume above 1',
      { ...VALID, audio: { ...VALID.audio, music: 3 } },
      'audio.music: invalid value',
    ],
    ['a missing group', { ...VALID, video: undefined }, 'video: not an object'],
    [
      'a zero render scale',
      { ...VALID, video: { ...VALID.video, renderScale: 0 } },
      'video.renderScale: invalid value',
    ],
    [
      'a non-boolean toggle',
      { ...VALID, accessibility: { ...VALID.accessibility, reduceMotion: 'yes' } },
      'accessibility.reduceMotion: invalid value',
    ],
  ])('rejects %s and names the field', (_case, value, reason) => {
    expect(reasonFor(value)).toBe(reason);
  });
});
