import type { BindingConflictPolicy, InputAction, InputChord } from '../../bridge/Binding.types';
import type { UiIntent } from '../../bridge/events';
import { KEY_LABELS, MOUSE_BUTTON_LABELS } from '../strings';

/**
 * Where press-to-bind is (architecture 13 §6.3): nothing selected, waiting for an input for
 * `action`, or holding the captured `chord` until the player confirms.
 */
export type CaptureState =
  | { readonly step: 'idle' }
  | { readonly step: 'listening'; readonly action: InputAction }
  | { readonly step: 'confirming'; readonly action: InputAction; readonly chord: InputChord };

/** The fields of a `keydown` the capture reads. */
export type CapturedKey = {
  readonly code: string;
  readonly key: string;
  readonly repeat: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  /** The key went to a control that must keep working while capturing (dialog, resets). */
  readonly isExemptTarget: boolean;
};

/**
 * What one input did: the next state, the intent to emit (on save) and whether the input was
 * used, so the caller prevents its browser default and stops it reaching the game.
 */
export type CaptureStep = {
  readonly state: CaptureState;
  readonly intent: UiIntent | null;
  readonly isConsumed: boolean;
};

export const IDLE: CaptureState = { step: 'idle' };

// Inputs press-to-bind never takes: focus moves, reload, devtools (the browser keeps them).
const PASSED_THROUGH_CODES: readonly string[] = ['Tab', 'F5', 'F12'];
const CANCEL_CODE = 'Escape';
const SAVE_CODE = 'Enter';

/** The label a key shows: `KEY_LABELS`, else the key upper-cased (`w` → `W`). */
export function keyLabel(key: string): string {
  return KEY_LABELS[key] ?? (key.length === 1 ? key.toUpperCase() : key);
}

/** The intent that saves `chord` for the action being bound. */
export function saveIntent(
  state: CaptureState,
  onConflict: BindingConflictPolicy,
): UiIntent | null {
  return state.step === 'confirming'
    ? { kind: 'update-binding', action: state.action, chord: state.chord, onConflict }
    : null;
}

/**
 * Feeds one `keydown` to the capture. Enter saves (swapping on a conflict); Escape cancels.
 * On an exempt control only Escape is taken, so Enter and Space still press the focused button.
 */
export function captureKey(state: CaptureState, input: CapturedKey): CaptureStep {
  const isPassedThrough =
    PASSED_THROUGH_CODES.includes(input.code) || input.ctrlKey || input.metaKey;
  if (state.step === 'idle' || isPassedThrough) {
    return { state, intent: null, isConsumed: false };
  }
  if (input.code === CANCEL_CODE) {
    return { state: IDLE, intent: null, isConsumed: true };
  }
  if (input.isExemptTarget) {
    return { state, intent: null, isConsumed: false };
  }
  if (input.repeat) {
    return { state, intent: null, isConsumed: true };
  }
  if (state.step === 'confirming' && input.code === SAVE_CODE) {
    return { state: IDLE, intent: saveIntent(state, 'swap'), isConsumed: true };
  }
  const chord: InputChord = {
    device: 'keyboard',
    code: input.code === '' ? input.key : input.code,
    label: keyLabel(input.key),
  };
  return {
    state: { step: 'confirming', action: state.action, chord },
    intent: null,
    isConsumed: true,
  };
}

/**
 * Feeds one `pointerdown` (`MouseEvent.button` 0–4, side buttons included) to the capture. A
 * press on an exempt control is a click, not a binding.
 */
export function captureButton(
  state: CaptureState,
  button: number,
  isExemptTarget: boolean,
): CaptureStep {
  const label = MOUSE_BUTTON_LABELS[button];
  if (state.step === 'idle' || label === undefined || isExemptTarget) {
    return { state, intent: null, isConsumed: false };
  }
  const chord: InputChord = { device: 'mouse', code: String(button), label };
  return {
    state: { step: 'confirming', action: state.action, chord },
    intent: null,
    isConsumed: true,
  };
}
