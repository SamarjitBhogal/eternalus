import type { ReactElement } from 'react';

import type { InputAction } from '../../bridge/Binding.types';
import { useAppSelector } from '../../bridge/hooks';
import { settingsSlice } from '../../bridge/slices/settingsSlice';
import { STRINGS } from '../strings';
import styles from './KeyGlyph.module.css';

const { selectBindingLabel } = settingsSlice.selectors;

/**
 * How a glyph is drawn: `inline` = the key cap in running text (default); `bare` = the `<kbd>` with
 * the surrounding font and no box (a key cap the caller draws, 58:328, 62:84); `hud` = the HUD's
 * 25 × 25 cream-outlined box (65:667).
 */
type KeyGlyphAppearance = 'inline' | 'bare' | 'hud';

const APPEARANCE_CLASS: Readonly<Record<KeyGlyphAppearance, string | undefined>> = {
  inline: styles.glyph,
  bare: styles.bare,
  hud: styles.hud,
};

/**
 * The key or button currently bound to `action`, as a `<kbd>`: `<KeyGlyph action="ability-1"/>`.
 * The label comes from the store, never from code, so a rebinding re-renders every glyph.
 */
export function KeyGlyph({
  action,
  appearance = 'inline',
}: {
  readonly action: InputAction;
  readonly appearance?: KeyGlyphAppearance;
}): ReactElement {
  const label = useAppSelector((state) => selectBindingLabel(state, action));
  return <kbd className={APPEARANCE_CLASS[appearance]}>{label ?? STRINGS.unbound}</kbd>;
}
