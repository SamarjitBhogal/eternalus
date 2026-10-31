import type {
  Binding,
  BindingConflictPolicy,
  ChordModifier,
  InputAction,
  InputChord,
} from '../../bridge/Binding.types';
import { chordKey } from '../../bridge/chordKey';
import { DEFAULT_CHORDS, withDefaults } from './keybindings';

/**
 * Makes `chord` the only chord of `action`, as press-to-bind does. Another action that already
 * holds the same input either takes `action`'s previous first chord (`swap`) or loses the input
 * (`replace`), so the result never binds one input to two actions.
 */
export function rebind(
  bindings: readonly Binding[],
  action: InputAction,
  chord: InputChord,
  policy: BindingConflictPolicy,
): Binding[] {
  const taken = chordKey(chord);
  const previous = bindings.find((binding) => binding.action === action)?.chords[0];
  const replacement = policy === 'swap' && previous !== undefined ? [previous] : [];
  return bindings.map((binding) => {
    if (binding.action === action) {
      return { action, chords: [chord] };
    }
    return {
      action: binding.action,
      chords: binding.chords.flatMap((held) => (chordKey(held) === taken ? replacement : [held])),
    };
  });
}

/**
 * Restores the default chords of one action, or of every action when `action` is `null`. Other
 * actions lose any input the restored defaults use, so a reset never creates a conflict.
 */
export function resetBindings(bindings: readonly Binding[], action: InputAction | null): Binding[] {
  if (action === null) {
    return withDefaults([]);
  }
  const defaults = DEFAULT_CHORDS[action];
  const restored = new Set(defaults.map(chordKey));
  return bindings.map((binding) =>
    binding.action === action
      ? { action, chords: defaults }
      : {
          action: binding.action,
          chords: binding.chords.filter((held) => !restored.has(chordKey(held))),
        },
  );
}

/**
 * Lists the platform's own modifier chords first in every action: Cmd (Meta) chords on an Apple
 * device, Ctrl chords elsewhere (DEC-118). The settings screen and the prompts show the first
 * chord first. The order of the actions and of the other chords stays.
 */
export function ownPlatformChordsFirst(
  bindings: readonly Binding[],
  isApplePlatform: boolean,
): Binding[] {
  const own: ChordModifier = isApplePlatform ? 'Meta' : 'Control';
  const isOwn = (chord: InputChord): boolean => chord.modifiers?.includes(own) === true;
  return bindings.map((binding) => ({
    action: binding.action,
    chords: binding.chords.toSorted((a, b) => Number(isOwn(b)) - Number(isOwn(a))),
  }));
}
