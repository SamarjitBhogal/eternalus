/** Presentation colours and motifs; no ability balance or collision values live here. */
export const COMBAT_SPELL_PALETTES: Readonly<
  Record<
    string,
    {
      readonly core: string;
      readonly glow: string;
      readonly stone: string;
      readonly isSentinel: boolean;
    }
  >
> = {
  'assassin-sprites': { core: '#ffe6a0', glow: '#bf851e', stone: '#594630', isSentinel: false },
  'knight-sprites': { core: '#fff4b2', glow: '#ff681c', stone: '#4c2c23', isSentinel: false },
  'paladin-sprites': { core: '#fffce6', glow: '#eac165', stone: '#6e6553', isSentinel: false },
  'colossus-sprites': { core: '#d3ffff', glow: '#4ddbdc', stone: '#536c75', isSentinel: true },
  'juggernaut-sprites': { core: '#c6edff', glow: '#438dff', stone: '#303f61', isSentinel: true },
};
