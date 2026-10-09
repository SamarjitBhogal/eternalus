import { type KeyboardEvent, type PointerEvent, type SyntheticEvent, useState } from 'react';

import type { BindingConflictPolicy, InputAction } from '../../bridge/Binding.types';
import { emitIntent } from '../../bridge/eventBus';
import {
  captureButton,
  captureKey,
  type CaptureState,
  type CaptureStep,
  IDLE,
  saveIntent,
} from './SettingsScreen.capture';

/** Elements marked with this attribute (dialog buttons, resets) are clicked, not captured. */
export const CAPTURE_EXEMPT = 'data-capture-exempt';

/** The press-to-bind state and the handlers the controls list attaches. */
export type BindingCapture = {
  readonly state: CaptureState;
  /** Starts listening for `action`'s new input; ignored while another capture is open. */
  readonly start: (action: InputAction) => void;
  /** Saves the captured input, resolving a conflict with `policy`. */
  readonly save: (policy: BindingConflictPolicy) => void;
  /** Drops the capture. */
  readonly cancel: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onPointerDown: (event: PointerEvent) => void;
  /** Keeps the context menu and middle-click actions away while capturing. */
  readonly onSuppressible: (event: SyntheticEvent) => void;
};

function isExempt(target: EventTarget): boolean {
  return target instanceof Element && target.closest(`[${CAPTURE_EXEMPT}]`) !== null;
}

/**
 * Press-to-bind (architecture 13 §6.3): wires React key and pointer events to the capture
 * state machine in `SettingsScreen.capture.ts` and emits the save as a `ui-intent`.
 */
export function useBindingCapture(): BindingCapture {
  const [state, setState] = useState<CaptureState>(IDLE);

  const apply = (step: CaptureStep, event: SyntheticEvent): void => {
    if (!step.isConsumed) {
      return;
    }
    // Consumed inputs neither reach the browser nor the game's own listeners.
    event.preventDefault();
    event.stopPropagation();
    setState(step.state);
    if (step.intent !== null) {
      emitIntent(step.intent);
    }
  };

  return {
    state,
    start: (action) => {
      if (state.step === 'idle') {
        setState({ step: 'listening', action });
      }
    },
    save: (policy) => {
      const intent = saveIntent(state, policy);
      if (intent !== null) {
        emitIntent(intent);
      }
      setState(IDLE);
    },
    cancel: () => {
      setState(IDLE);
    },
    onKeyDown: (event) => {
      apply(captureKey(state, event), event);
    },
    onPointerDown: (event) => {
      if (!isExempt(event.target)) {
        apply(captureButton(state, event.button), event);
      }
    },
    onSuppressible: (event) => {
      if (state.step !== 'idle') {
        event.preventDefault();
      }
    },
  };
}
