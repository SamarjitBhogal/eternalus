import type { Binding, InputAction, InputChord } from '../../bridge/Binding.types';
import { chordKey } from '../../bridge/chordKey';
import type { BindingConflict } from './BindingResolver.types';

/**
 * Looks up which actions a physical input triggers under the current bindings, and reports
 * inputs bound to more than one action. Indexed by `chordKey`, so a lookup is one map read.
 */
export class BindingResolver {
  private actionsByChord = new Map<string, InputAction[]>();

  /** Replaces the bindings and rebuilds the index. Call it after every rebinding. */
  public setBindings(bindings: readonly Binding[]): void {
    const index = new Map<string, InputAction[]>();
    for (const binding of bindings) {
      for (const chord of binding.chords) {
        const key = chordKey(chord);
        const actions = index.get(key) ?? [];
        if (!actions.includes(binding.action)) {
          actions.push(binding.action);
        }
        index.set(key, actions);
      }
    }
    this.actionsByChord = index;
  }

  /** The actions `chord` (with its modifiers, if any) triggers, in binding order; empty when unbound. */
  public actionsFor(
    chord: Pick<InputChord, 'device' | 'code' | 'modifiers'>,
  ): readonly InputAction[] {
    return this.actionsByChord.get(chordKey(chord)) ?? [];
  }

  /** Every input bound to two or more actions. Empty for a valid set of bindings. */
  public conflicts(): readonly BindingConflict[] {
    return [...this.actionsByChord]
      .filter(([, actions]) => actions.length > 1)
      .map(([chord, actions]) => ({ chord, actions }));
  }
}
