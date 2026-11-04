/** What the writer needs of `fetch`: a bound `window.fetch` in the page, a fake in tests. */
export type ReportFetch = (
  url: string,
  init: RequestInit,
) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

/** What `DevServerReportWriter` is built from. */
export type DevServerReportWriterDeps = {
  readonly fetch: ReportFetch;
  /**
   * Runs `callback` once, `delayMs` from now, and returns a function that cancels it: the page's
   * `SessionClock.schedule`; a fake in tests, so no test waits for real time.
   */
  readonly schedule: (callback: () => void, delayMs: number) => () => void;
};
