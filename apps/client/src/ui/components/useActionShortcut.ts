import { useEffect, useRef } from 'react';

import type { Binding, InputAction } from '../../bridge/Binding.types';
import { useAppSelector } from '../../bridge/hooks';
import { settingsSlice } from '../../bridge/slices/settingsSlice';
import { bindActionShortcut } from './actionShortcut';

/** Where a mounted shortcut finds the latest bindings and press handler (the hook's refs). */
type LatestShortcut = {
  readonly bindings: { readonly current: readonly Binding[] };
  readonly onPress: { readonly current: () => void };
};

/**
 * `bindActionShortcut` on `target` that reads `latest` at press time: the bindings and the
 * `onPress` current when the press arrives, so pointing the refs at newer values (a rebind, or a
 * closure over newer props such as `usePauseMenuKey`'s `overlay`) takes effect without listening
 * again.
 * @returns Removes every listener it added.
 */
export function bindLatestActionShortcut(
  target: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>,
  action: InputAction,
  latest: LatestShortcut,
): () => void {
  return bindActionShortcut(
    target,
    () => latest.bindings.current,
    action,
    () => {
      latest.onPress.current();
    },
  );
}

/**
 * While mounted, a press of one of `action`'s bound keys or mouse buttons (read from the store at
 * press time) calls `onPress` and prevents that press's default (`bindLatestActionShortcut` on
 * `window`). Rebinding or a new `onPress` takes effect without listening again.
 */
export function useActionShortcut(action: InputAction, onPress: () => void): void {
  const bindings = useAppSelector(settingsSlice.selectors.selectBindings);
  const bindingsRef = useRef(bindings);
  const onPressRef = useRef(onPress);
  useEffect(() => {
    bindingsRef.current = bindings;
    onPressRef.current = onPress;
  });
  useEffect(
    () => bindLatestActionShortcut(window, action, { bindings: bindingsRef, onPress: onPressRef }),
    [action],
  );
}
