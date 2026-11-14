/** Presentation timing in seconds; six separate poses are held long enough to read. */
export const LEGEND_ANIMATION = {
  frames: 6,
  idleSeconds: 1.2,
  walkSeconds: 0.84,
  attackSeconds: 0.72,
  castSeconds: 1.2,
  spriteSize: 6.8,
} as const;
/** Atlas rows follow the recorded generation layout, independent of gameplay slot numbers. */
export const LEGEND_CAST_ROWS: Readonly<Record<string, number>> = {
  veil: 6,
  'blade-runner': 7,
  hamstring: 8,
  fury: 9,
  'shield-wall': 6,
  sunder: 7,
  'colossus-roar': 8,
  'meteor-fall': 9,
  imbue: 6,
  shockwave: 7,
  sanctuary: 8,
  nova: 9,
};
/** The stable content id for Heretic remains necromancer. */
export const LEGEND_SKINS: Readonly<Record<string, string>> = {
  assassin: 'assassin-sprites',
  knight: 'knight-sprites',
  paladin: 'paladin-sprites',
  colossus: 'colossus-sprites',
  juggernaut: 'juggernaut-sprites',
  catalyst: 'catalyst-sprites',
  oracle: 'oracle-sprites',
  necromancer: 'necromancer-sprites',
};

/** Only staff users announce their attack when firing, rather than when melee damage resolves. */
export const RANGED_LEGEND_SKINS: ReadonlySet<string> = new Set([
  'catalyst',
  'oracle',
  'necromancer',
]);

/** Visual playback only: these durations do not change cooldowns or damage timing. */
export const LEGEND_CAST_SECONDS: Readonly<Record<string, number>> = {
  veil: 2.4,
  'blade-runner': 1.8,
  hamstring: 1.8,
  fury: 3.6,
  'shield-wall': 2.8,
  sunder: 2.4,
  'colossus-roar': 2.8,
  'meteor-fall': 3.6,
};
/** Bounded presentation history; cosmetic cracks fade rather than accumulating in the world. */
export const LEGEND_EFFECT_HISTORY = { limit: 4, seconds: 6 } as const;
