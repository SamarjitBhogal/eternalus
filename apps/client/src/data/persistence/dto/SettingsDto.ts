import type { DtoCheck } from './DtoCheck.types';

/** The modifier keys a stored keyboard chord may name (`bridge/Binding.types.ts` `ChordModifier`). */
const CHORD_MODIFIERS = ['Alt', 'Control', 'Meta', 'Shift'] as const;

/** A stored chord: the same shape as `bridge/Binding.types.ts` `InputChord`. */
type ChordDtoV1 = {
  readonly device: 'keyboard' | 'mouse' | 'gamepad';
  readonly code: string;
  readonly label: string;
  /** Optional, so records saved before modifier chords (DEC-105) still read as version 1. */
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

/** The `settings` store record, one per profile (architecture 14 §7). */
export type SettingsDtoV1 = PersistedSettings & {
  readonly schemaVersion: 1;
  readonly profileId: string;
};

type FieldCheck = (value: unknown) => boolean;

const CHORD_DEVICES: readonly unknown[] = ['keyboard', 'mouse', 'gamepad'];
const isBoolean: FieldCheck = (value) => typeof value === 'boolean';
const isVolume: FieldCheck = (value) => typeof value === 'number' && value >= 0 && value <= 1;
const isScale: FieldCheck = (value) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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

function settingsProblem(value: unknown, knownActions: ReadonlySet<string>): string | null {
  if (!isRecord(value)) {
    return 'not an object';
  }
  if (value.schemaVersion !== 1) {
    return `schemaVersion: unsupported version ${String(value.schemaVersion)}`;
  }
  if (typeof value.profileId !== 'string') {
    return 'profileId: not a string';
  }
  return (
    bindingsProblem(value.bindings, knownActions) ??
    groupProblem('audio', value.audio, { master: isVolume, music: isVolume, effects: isVolume }) ??
    groupProblem('video', value.video, { fullscreen: isBoolean, renderScale: isScale }) ??
    groupProblem('accessibility', value.accessibility, {
      reduceMotion: isBoolean,
      colourBlindMode: isBoolean,
    })
  );
}

/**
 * Checks a stored settings record before anything trusts it (architecture 14 §8). Actions are
 * checked against `knownActions`, which `main.tsx` injects from `game/input/keybindings.ts`.
 * The reason names the first bad field.
 */
export function validateSettingsDto(
  value: unknown,
  knownActions: ReadonlySet<string>,
): DtoCheck<SettingsDtoV1> {
  const reason = settingsProblem(value, knownActions);
  // Every field of SettingsDtoV1 was checked above.
  return reason === null ? { ok: true, dto: value as SettingsDtoV1 } : { ok: false, reason };
}
