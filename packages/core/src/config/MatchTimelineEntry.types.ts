import type { MatchPhase } from './matchPhases';

/** When a timeline entry fires: a fixed tick, or a fraction of `plannedMatchSeconds` (12 §3). */
export type TimelineMark = { readonly atTick: number } | { readonly atFraction: number };

/**
 * What a `TimelineMark` resolves against (`timelineMarkTick`): named, not positional, so the three
 * numbers cannot be swapped.
 */
export type TimelineFrame = {
  readonly tickRate: number;
  readonly plannedMatchSeconds: number;
  /** The tick the pre-match countdown ends (`countdownTicks`); `atFraction` counts from it. */
  readonly countdownEndTick: number;
};

/** Each timeline action's fields, by kind. A new kind is one line here and one handler class. */
type TimelineActionPayloads = {
  readonly 'enter-phase': { readonly phase: MatchPhase };
  /** The gem erupts and summons `bossId` (12 §3), which `SpawnSystem` spawns on its next pass. */
  readonly 'summon-greater-boss': { readonly bossId: string };
};

/** The kind of a timeline action, e.g. `enter-phase`. */
export type TimelineActionKind = keyof TimelineActionPayloads;

/** What a timeline entry does, discriminated by `kind`; `TimelineAction<'enter-phase'>` is one member. */
export type TimelineAction<K extends TimelineActionKind = TimelineActionKind> = {
  readonly [P in K]: { readonly kind: P } & TimelineActionPayloads[P];
}[K];

/** One timed event of a match (architecture 12 §3). Part of `GameConfig`, so it is data. */
export type MatchTimelineEntry = {
  /** Stable and unique in the timeline, e.g. `countdown-over`; the HUD picks its marks by it. */
  readonly id: string;
  readonly at: TimelineMark;
  readonly action: TimelineAction;
};
