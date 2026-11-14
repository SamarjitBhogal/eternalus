import type { MatchEndReason, RejectReason } from '@eternalus/protocol';

/** Every `MatchEndReason`, checked at run time. */
export const MATCH_END_REASONS: ReadonlySet<string> = new Set<MatchEndReason>([
  'finished',
  'opponent-left',
]);

/** Every `RejectReason`, checked at run time. */
export const REJECT_REASONS: ReadonlySet<string> = new Set<RejectReason>([
  'malformed',
  'too-large',
  'rate-limited',
  'not-in-match',
  'in-match',
]);
