import type { ReactElement } from 'react';

import type { InputAction } from '../../bridge/Binding.types';
import { useAppSelector } from '../../bridge/hooks';
import { settingsSlice } from '../../bridge/slices/settingsSlice';
import { STRINGS } from '../strings';
import styles from './KeyGlyph.module.css';

const { selectBindingLabel } = settingsSlice.selectors;

/**
 * The key or button currently bound to `action`, as a `<kbd>`: `<KeyGlyph action="ability-1"/>`.
 * The label comes from the store, never from code, so a rebinding re-renders every glyph.
 */
export function KeyGlyph({ action }: { readonly action: InputAction }): ReactElement {
  const label = useAppSelector((state) => selectBindingLabel(state, action));
  return <kbd className={styles.glyph}>{label ?? STRINGS.unbound}</kbd>;
}
