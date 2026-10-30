import { useEffect, useRef } from 'react';

import { useAppSelector } from '../../bridge/hooks';
import { settingsSlice } from '../../bridge/slices/settingsSlice';
import { bindModalKeyFilter } from './modalKeyFilter';

/**
 * While `isOpen`, only a `pause-menu` key works and it calls `onClose` (`bindModalKeyFilter` on
 * `window`, DEC-65); the bindings and `onClose` are read at press time, so a rebinding or a new
 * `onClose` takes effect without listening again.
 */
export function useModalKeyFilter(isOpen: boolean, onClose: () => void): void {
  const bindings = useAppSelector(settingsSlice.selectors.selectBindings);
  const bindingsRef = useRef(bindings);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    bindingsRef.current = bindings;
    onCloseRef.current = onClose;
  });
  useEffect(() => {
    if (!isOpen) return undefined;
    return bindModalKeyFilter(
      window,
      () => bindingsRef.current,
      () => {
        onCloseRef.current();
      },
    );
  }, [isOpen]);
}
