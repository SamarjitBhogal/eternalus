/** Ticks between `match-clock`/`hud-state` publishes at the default 30 TPS: 6 = 5 Hz (08 §7, 13 §5). */
export const HUD_PUBLISH_EVERY_TICKS = 6;

/** Ticks between `structure-state`/`capture-state` publishes (13 §5: every 30 ticks). */
export const ROSTER_PUBLISH_EVERY_TICKS = 30;

/** The timeline entry that ends the countdown (the default timeline's first, `defaultGameConfig.ts`). */
export const COUNTDOWN_OVER_ENTRY_ID = 'countdown-over';

/** The phase the match enters when the countdown ends; its first second shows "START". */
export const POST_COUNTDOWN_PHASE = 'early-game';
