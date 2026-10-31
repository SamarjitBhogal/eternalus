/**
 * What the crash popup shows (ADR 0025 §3, §5; DEC-106, DEC-124), published as `crash-report` by
 * the session. `asking`: the note field and the two buttons; `saving`: the note is on its way;
 * `saved`: the report is in `file`; `copy`: the report could not be saved, so `copyText` is the
 * report (with the note, once one is saved) for the player to copy. `noteLimit` is the longest
 * note the writer takes, in characters; the session sets it, so `ui/` never imports `data/`.
 */
export type CrashReportState = { readonly noteLimit: number } & (
  | { readonly stage: 'asking' | 'saving' }
  | { readonly stage: 'saved'; readonly file: string }
  | { readonly stage: 'copy'; readonly copyText: string }
);
