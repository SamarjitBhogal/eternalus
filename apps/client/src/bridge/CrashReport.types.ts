/**
 * What the crash popup shows (ADR 0025 §3, §5; DEC-106, DEC-124), published as `crash-report` by
 * the session. `asking`: the note field and the two buttons; `saving`: the note is on its way;
 * `saved`: the report is in `file`; `copy`: `copyText` is for the player to copy, either the whole
 * report (it could not be saved) or, when `isReportSaved`, only the note (the report is saved, the
 * note write failed). `noteLimit` is the longest note the writer takes, in characters; the session
 * sets it, so `ui/` never imports `data/`. `cause` says what stopped (the match or a screen), and
 * `crashNumber` changes with each crash of this page load, so the popup starts clean for each one.
 */
export type CrashReportState = {
  readonly noteLimit: number;
  readonly cause: 'match' | 'screen';
  readonly crashNumber: number;
} & CrashReportStage;

/** The stage-specific part of `CrashReportState`. */
export type CrashReportStage =
  | { readonly stage: 'asking' | 'saving' }
  | { readonly stage: 'saved'; readonly file: string }
  | { readonly stage: 'copy'; readonly copyText: string; readonly isReportSaved: boolean };
