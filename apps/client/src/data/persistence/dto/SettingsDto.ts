import type { DtoCheck } from './DtoCheck.types';
import { isRecord } from './dtoCheck';

/** The modifier keys a stored keyboard chord may name (`bridge/Binding.types.ts` `ChordModifier`). */
const CHORD_MODIFIERS = ['Alt', 'Control', 'Meta', 'Shift'] as const;

/** A stored chord: the same shape as `bridge/Binding.types.ts` `InputChord`. */
type ChordDtoV1 = {
  readonly device: 'keyboard' | 'mouse' | 'gamepad';
  readonly code: string;
  readonly label: string;
  /**
   * Optional, so records saved before modifier chords (DEC-105) still read as version 1. An
   * optional field that old saves lack needs no `schemaVersion` bump (DEC-125).
   */
  readonly modifiers?: readonly (typeof CHORD_MODIFIERS)[number][];
};

/** A stored binding. `action` is a plain string here: `data/` does not know the action list. */
type BindingDtoV1 = { readonly action: string; readonly chords: readonly ChordDtoV1[] };

/** The settings a profile keeps: what `settingsSlice` holds, in storable form. */
export type PersistedSettings = {
  readonly bindings: readonly BindingDtoV1[];
  readonly audio: { readonly master: number; readonly music: number; readonly effects: number };
  readonly video: { readonly fullscreen: boolean; readonly renderScale: number };
  readonly accessibility: { readonly reduceMotion: boolean; readonly colourBlindMode: boolean };
};

/** A settings group: one `settings` store record per profile and group (architecture 14 §7). */
export type SettingsGroup = keyof PersistedSettings;

/** What each group's record keeps in `value` (the bindings are wrapped so a preset can join). */
type SettingsGroupValues = {
  readonly bindings: { readonly bindings: PersistedSettings['bindings'] };
  readonly audio: PersistedSettings['audio'];
  readonly video: PersistedSettings['video'];
  readonly accessibility: PersistedSettings['accessibility'];
};

/** The `settings` store record, one per profile and group, keyed `[profileId, group]`. */
export type SettingsGroupDtoV1<G extends SettingsGroup = SettingsGroup> = {
  readonly schemaVersion: 1;
  readonly profileId: string;
  readonly group: G;
  readonly value: SettingsGroupValues[G];
};

/** How one group is checked, written and read back. The registry below has one entry per group. */
type GroupSpec<G extends SettingsGroup> = {
  readonly problem: (value: unknown, knownActions: ReadonlySet<string>) => string | null;
  readonly pack: (settings: PersistedSettings) => SettingsGroupValues[G];
  readonly unpack: (value: SettingsGroupValues[G]) => Partial<PersistedSettings>;
};

type FieldCheck = (value: unknown) => boolean;

const CHORD_DEVICES: readonly unknown[] = ['keyboard', 'mouse', 'gamepad'];
const isBoolean: FieldCheck = (value) => typeof value === 'boolean';
const isVolume: FieldCheck = (value) => typeof value === 'number' && value >= 0 && value <= 1;
const isScale: FieldCheck = (value) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

function isModifierList(value: unknown): boolean {
  const known: readonly unknown[] = CHORD_MODIFIERS;
  return value === undefined || (Array.isArray(value) && value.every((key) => known.includes(key)));
}

function isChord(value: unknown): boolean {
  return (
    isRecord(value) &&
    CHORD_DEVICES.includes(value.device) &&
    typeof value.code === 'string' &&
    typeof value.label === 'string' &&
    isModifierList(value.modifiers)
  );
}

function groupProblem(
  name: string,
  value: unknown,
  fields: Readonly<Record<string, FieldCheck>>,
): string | null {
  if (!isRecord(value)) {
    return `${name}: not an object`;
  }
  const bad = Object.entries(fields).find(([field, check]) => !check(value[field]));
  return bad === undefined ? null : `${name}.${bad[0]}: invalid value`;
}

function bindingsProblem(value: unknown, knownActions: ReadonlySet<string>): string | null {
  if (!Array.isArray(value)) {
    return 'bindings: not an array';
  }
  const bindings: readonly unknown[] = value;
  for (const [index, binding] of bindings.entries()) {
    if (!isRecord(binding) || typeof binding.action !== 'string') {
      return `bindings[${String(index)}]: not a binding`;
    }
    if (!knownActions.has(binding.action)) {
      return `bindings[${String(index)}].action: unknown action "${binding.action}"`;
    }
    if (!Array.isArray(binding.chords) || !(binding.chords as unknown[]).every(isChord)) {
      return `bindings[${String(index)}].chords: invalid chord`;
    }
  }
  return null;
}

const GROUP_SPECS: { readonly [G in SettingsGroup]: GroupSpec<G> } = {
  bindings: {
    problem: (value, knownActions) =>
      isRecord(value) ? bindingsProblem(value.bindings, knownActions) : 'bindings: not an object',
    pack: ({ bindings }) => ({ bindings }),
    unpack: ({ bindings }) => ({ bindings }),
  },
  audio: {
    problem: (value) =>
      groupProblem('audio', value, { master: isVolume, music: isVolume, effects: isVolume }),
    pack: ({ audio }) => audio,
    unpack: (audio) => ({ audio }),
  },
  video: {
    problem: (value) =>
      groupProblem('video', value, { fullscreen: isBoolean, renderScale: isScale }),
    pack: ({ video }) => video,
    unpack: (video) => ({ video }),
  },
  accessibility: {
    problem: (value) =>
      groupProblem('accessibility', value, { reduceMotion: isBoolean, colourBlindMode: isBoolean }),
    pack: ({ accessibility }) => accessibility,
    unpack: (accessibility) => ({ accessibility }),
  },
};

/** Every group that is stored, in write order. */
export const SETTINGS_GROUPS: readonly SettingsGroup[] = Object.keys(
  GROUP_SPECS,
) as SettingsGroup[];

function groupDtoProblem(
  group: SettingsGroup,
  value: unknown,
  knownActions: ReadonlySet<string>,
): string | null {
  if (!isRecord(value)) {
    return 'not an object';
  }
  if (value.schemaVersion !== 1) {
    return `schemaVersion: unsupported version ${String(value.schemaVersion)}`;
  }
  if (typeof value.profileId !== 'string') {
    return 'profileId: not a string';
  }
  if (value.group !== group) {
    return `group: expected "${group}"`;
  }
  return GROUP_SPECS[group].problem(value.value, knownActions);
}

/**
 * Checks the stored record of one settings group before anything trusts it (architecture 14 §8).
 * Actions are checked against `knownActions`, which `main.tsx` injects from
 * `game/input/keybindings.ts`. The reason names the first bad field.
 */
export function validateSettingsGroupDto(
  group: SettingsGroup,
  value: unknown,
  knownActions: ReadonlySet<string>,
): DtoCheck<SettingsGroupDtoV1> {
  const reason = groupDtoProblem(group, value, knownActions);
  // Every field of the record was checked above.
  return reason === null ? { ok: true, dto: value as SettingsGroupDtoV1 } : { ok: false, reason };
}

/** The record that saves `group` of `settings` for `profileId`. */
export function toSettingsGroupDto<G extends SettingsGroup>(
  profileId: string,
  group: G,
  settings: PersistedSettings,
): SettingsGroupDtoV1<G> {
  return { schemaVersion: 1, profileId, group, value: GROUP_SPECS[group].pack(settings) };
}

/** The settings a group record holds, as a partial of `PersistedSettings`. */
export function settingsFromGroupDto<G extends SettingsGroup>(
  dto: SettingsGroupDtoV1<G>,
): Partial<PersistedSettings> {
  return GROUP_SPECS[dto.group].unpack(dto.value);
}
