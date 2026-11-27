import { describe, expect, it } from 'vitest';

import type { SettingsGroup, SettingsGroupDtoV1 } from './SettingsDto';
import { validateSettingsGroupDto } from './SettingsDto';

const KNOWN_ACTIONS = new Set(['move-up', 'attack']);

function record<G extends SettingsGroup>(
  group: G,
  value: SettingsGroupDtoV1<G>['value'],
): SettingsGroupDtoV1<G> {
  return { schemaVersion: 1, profileId: 'local', group, value };
}

const BINDINGS = record('bindings', {
  bindings: [
    { action: 'move-up', chords: [{ device: 'keyboard', code: 'ArrowUp', label: '↑' }] },
    { action: 'attack', chords: [{ device: 'mouse', code: '0', label: 'LMB' }] },
  ],
});
const AUDIO = record('audio', { master: 1, music: 0.5, effects: 0 });
const VIDEO = record('video', { fullscreen: false, renderScale: 1 });
const ACCESSIBILITY = record('accessibility', { reduceMotion: true, colourBlindMode: false });

function reasonFor(group: SettingsGroup, value: unknown): string | null {
  const checked = validateSettingsGroupDto(group, value, KNOWN_ACTIONS);
  return checked.ok ? null : checked.reason;
}

describe('validateSettingsGroupDto', () => {
  it.each([BINDINGS, AUDIO, VIDEO, ACCESSIBILITY])('accepts a well-formed $group record', (dto) => {
    expect(validateSettingsGroupDto(dto.group, dto, KNOWN_ACTIONS)).toEqual({ ok: true, dto });
  });

  it('accepts a keyboard chord with modifier keys (DEC-105)', () => {
    const chord = {
      device: 'keyboard',
      code: 'F3',
      label: 'Ctrl+Shift+F3',
      modifiers: ['Control', 'Shift'],
    } as const;
    const dto = record('bindings', { bindings: [{ action: 'attack', chords: [chord] }] });
    expect(validateSettingsGroupDto('bindings', dto, KNOWN_ACTIONS)).toEqual({ ok: true, dto });
  });

  const chordRecord = (chord: unknown): unknown => ({
    ...BINDINGS,
    value: { bindings: [{ action: 'attack', chords: [chord] }] },
  });

  it.each([
    ['a non-object', 'audio', 'settings', 'not an object'],
    [
      'a future version',
      'audio',
      { ...AUDIO, schemaVersion: 2 },
      'schemaVersion: unsupported version 2',
    ],
    ['a missing profile id', 'audio', { ...AUDIO, profileId: 7 }, 'profileId: not a string'],
    ['a record of another group', 'audio', VIDEO, 'group: expected "audio"'],
    [
      'a bindings value that is not an object',
      'bindings',
      { ...BINDINGS, value: 3 },
      'bindings: not an object',
    ],
    [
      'bindings that are not a list',
      'bindings',
      { ...BINDINGS, value: { bindings: {} } },
      'bindings: not an array',
    ],
    [
      'a binding that is not an object',
      'bindings',
      { ...BINDINGS, value: { bindings: [null] } },
      'bindings[0]: not a binding',
    ],
    [
      'an unknown action',
      'bindings',
      { ...BINDINGS, value: { bindings: [{ action: 'fly', chords: [] }] } },
      'bindings[0].action: unknown action "fly"',
    ],
    [
      'a chord from an unknown device',
      'bindings',
      chordRecord({ device: 'pen', code: '0', label: '' }),
      'bindings[0].chords: invalid chord',
    ],
    [
      'a chord with an unknown modifier',
      'bindings',
      chordRecord({ device: 'keyboard', code: 'F3', label: 'F3', modifiers: ['Hyper'] }),
      'bindings[0].chords: invalid chord',
    ],
    [
      'a chord whose modifiers are not a list',
      'bindings',
      chordRecord({ device: 'keyboard', code: 'F3', label: 'F3', modifiers: 'Shift' }),
      'bindings[0].chords: invalid chord',
    ],
    [
      'a volume above 1',
      'audio',
      { ...AUDIO, value: { ...AUDIO.value, music: 3 } },
      'audio.music: invalid value',
    ],
    ['a missing value', 'video', { ...VIDEO, value: undefined }, 'video: not an object'],
    [
      'a zero render scale',
      'video',
      { ...VIDEO, value: { ...VIDEO.value, renderScale: 0 } },
      'video.renderScale: invalid value',
    ],
    [
      'a non-boolean toggle',
      'accessibility',
      { ...ACCESSIBILITY, value: { ...ACCESSIBILITY.value, reduceMotion: 'yes' } },
      'accessibility.reduceMotion: invalid value',
    ],
  ] as const)('rejects %s and names the field', (_case, group, value, reason) => {
    expect(reasonFor(group, value)).toBe(reason);
  });
});
