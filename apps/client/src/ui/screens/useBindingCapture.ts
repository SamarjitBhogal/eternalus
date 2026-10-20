import { type PointerEvent, type SyntheticEvent, useEffect, useState } from 'react';

import type { BindingConflictPolicy, InputAction } from '../../bridge/Binding.types';
import { emitIntent } from '../../bridge/eventBus';
import {
  captureButton,
  captureKey,
  type CaptureState,
  type CaptureStep,
  IDLE,
  saveIntent,
} from './bindingCapture';

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
  readonly onPointerDown: (event: PointerEvent) => void;
  /** Keeps the context menu and middle-click actions away while capturing. */
  readonly onSuppressible: (event: SyntheticEvent) => void;
};

function isExempt(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(`[${CAPTURE_EXEMPT}]`) !== null;
}

/**
 * Press-to-bind (architecture 13 §6.3): wires key and pointer events to the capture state
 * machine in `bindingCapture.ts` and emits the save as a `ui-intent`. While capturing, keys are
 * read on `window` in the capture phase: a clicked row is not focused in every browser (Safari,
 * Firefox), and a consumed key must not reach the game's own keyboard listener.
 */
export function useBindingCapture(): BindingCapture {
  const [state, setState] = useState<CaptureState>(IDLE);

  const apply = (
    step: CaptureStep,
    event: Pick<Event, 'preventDefault' | 'stopPropagation'>,
  ): void => {
    if (!step.isConsumed) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setState(step.state);
    if (step.intent !== null) {
      emitIntent(step.intent);
    }
  };

  useEffect(() => {
    if (state.step === 'idle') {
      return undefined;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      const { code, key, repeat, ctrlKey, metaKey } = event;
      const input = { code, key, repeat, ctrlKey, metaKey, isExemptTarget: isExempt(event.target) };
      apply(captureKey(state, input), event);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
    };
  });

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
    onPointerDown: (event) => {
      apply(captureButton(state, event.button, isExempt(event.target)), event);
    },
    onSuppressible: (event) => {
      if (state.step !== 'idle') {
        event.preventDefault();
      }
    },
  };
}
