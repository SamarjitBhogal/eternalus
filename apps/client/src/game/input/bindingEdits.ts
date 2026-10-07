import type {
  Binding,
  BindingConflictPolicy,
  InputAction,
  InputChord,
} from '../../bridge/Binding.types';
import { chordKey } from './chordKey';
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
