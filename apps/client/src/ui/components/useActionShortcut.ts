import { useEffect, useRef } from 'react';

import type { InputAction } from '../../bridge/Binding.types';
import { useAppSelector } from '../../bridge/hooks';
import { settingsSlice } from '../../bridge/slices/settingsSlice';
import { bindActionShortcut } from './actionShortcut';

/**
 * While mounted and enabled, a press of one of `action`'s bound keys or mouse buttons (read from the
 * store at press time) calls `onPress` and prevents that press's default (`bindActionShortcut` on
 * `window`). Rebinding or a new `onPress` takes effect without listening again.
 */
export function useActionShortcut(
  action: InputAction,
  onPress: () => void,
  isEnabled = true,
): void {
  const bindings = useAppSelector(settingsSlice.selectors.selectBindings);
  const bindingsRef = useRef(bindings);
  const onPressRef = useRef(onPress);
  useEffect(() => {
    bindingsRef.current = bindings;
    onPressRef.current = onPress;
  });
  useEffect(
    () =>
      isEnabled
        ? bindActionShortcut(
            window,
            () => bindingsRef.current,
            action,
            () => {
              onPressRef.current();
            },
          )
        : undefined,
    [action, isEnabled],
  );
}
