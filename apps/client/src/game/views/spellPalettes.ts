/** Presentation palettes inspired by the supplied Magus reference archives. */
export const SPELL_PALETTES: Readonly<
  Record<
    string,
    { readonly core: string; readonly glow: string; readonly shape: 'diamond' | 'ring' | 'dot' }
  >
> = {
  'catalyst-sprites': { core: '#ffc06a', glow: '#ff6b323d', shape: 'dot' },
  'oracle-sprites': { core: '#fff3cc', glow: '#e6e9ff38', shape: 'diamond' },
  'necromancer-sprites': { core: '#cc8bff', glow: '#993fff38', shape: 'ring' },
};
