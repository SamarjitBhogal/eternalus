import { describe, expect, it, vi } from 'vitest';

import { fakeErrorReport } from './__fixtures__/errorReports';
import { DevServerReportWriter } from './DevServerReportWriter';
import { REPORT_TIMEOUT_MS } from './DevServerReportWriter.constants';
import type { DevServerReportWriterDeps, ReportFetch } from './DevServerReportWriter.types';
import { ERROR_REPORTS_PATH } from './ErrorReport.constants';
import { describeReportWriter } from './ReportWriter.contract';

const answer = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** A timer whose time moves only on `advance` (no real time in tests). */
function fakeSchedule() {
  let now = 0;
  let pending: { readonly dueAt: number; readonly run: () => void }[] = [];
  const schedule: DevServerReportWriterDeps['schedule'] = (run, delayMs) => {
    const timer = { dueAt: now + delayMs, run };
    pending.push(timer);
    return () => {
      pending = pending.filter((other) => other !== timer);
    };
  };
  const advance = (ms: number): void => {
    now += ms;
    const due = pending.filter((timer) => timer.dueAt <= now);
    pending = pending.filter((timer) => timer.dueAt > now);
    for (const timer of due) timer.run();
  };
  return { schedule, advance, pendingCount: () => pending.length };
}

/** The endpoint as `fetch` sees it: saves under `report-<n>`, notes known ids, 404 otherwise. */
function fakeServer(): { readonly fetch: ReportFetch; readonly stored: (id: string) => unknown } {
  const reports = new Map<string, unknown>();
  const fetch: ReportFetch = (url, init) => {
    const body: unknown = typeof init.body === 'string' ? JSON.parse(init.body) : null;
    if (url === ERROR_REPORTS_PATH) {
      const id = `report-${String(reports.size + 1)}`;
      reports.set(id, body);
      return Promise.resolve(answer(201, { id, file: `logs/errors/${id}.json` }));
    }
    const id = /^\/__eternalus\/error-reports\/([^/]+)\/note$/.exec(url)?.[1] ?? '';
    const stored = reports.get(id);
    if (typeof stored !== 'object' || typeof body !== 'object') {
      return Promise.resolve(answer(404, { error: 'no such report' }));
    }
    reports.set(id, { ...stored, ...body });
    return Promise.resolve(answer(200, { id, file: `logs/errors/${id}.json` }));
  };
  return { fetch, stored: (id) => reports.get(id) };
}

/** Lets settled promises run their reactions, without timers. */
async function flushMicrotasks(): Promise<void> {
  for (let round = 0; round < 10; round += 1) await Promise.resolve();
}

describeReportWriter('DevServerReportWriter', () => {
  const server = fakeServer();
  const writer = new DevServerReportWriter({
    fetch: server.fetch,
    schedule: fakeSchedule().schedule,
  });
  return { writer, stored: server.stored };
});

describe('DevServerReportWriter', () => {
  it('posts the report as JSON to the endpoint and resolves to the answer', async () => {
    const fetch = vi.fn<ReportFetch>(() =>
      Promise.resolve(answer(201, { id: 'a', file: 'logs/errors/a.json' })),
    );
    const report = fakeErrorReport();

    const saved = await new DevServerReportWriter({
      fetch,
      schedule: fakeSchedule().schedule,
    }).save(report);

    expect(saved).toEqual({ id: 'a', file: 'logs/errors/a.json' });
    expect(fetch.mock.calls).toEqual([
      [
        '/__eternalus/error-reports',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report),
          signal: expect.any(AbortSignal) as unknown,
        },
      ],
    ]);
  });

  it('posts a note to <endpoint>/<id>/note', async () => {
    const fetch = vi.fn<ReportFetch>(() =>
      Promise.resolve(answer(200, { id: 'a', file: 'logs/errors/a.json' })),
    );

    await new DevServerReportWriter({ fetch, schedule: fakeSchedule().schedule }).addNote('a', 'n');

    expect(fetch.mock.calls[0]?.[0]).toBe('/__eternalus/error-reports/a/note');
    expect(fetch.mock.calls[0]?.[1].body).toBe('{"note":"n"}');
  });

  it.each([
    ['a 404 answer', () => Promise.resolve(answer(404, { error: 'no such report' }))],
    [
      'a 500 answer, even with an id and a file',
      () => Promise.resolve(answer(500, { id: 'a', file: 'logs/errors/a.json' })),
    ],
    ['a 2xx answer without an id and a file', () => Promise.resolve(answer(201, { id: 'a' }))],
    ['a network error', () => Promise.reject(new TypeError('Failed to fetch'))],
  ])('rejects %s', async (_name, respond: ReportFetch) => {
    const timer = fakeSchedule();
    const writer = new DevServerReportWriter({ fetch: respond, schedule: timer.schedule });

    await expect(writer.save(fakeErrorReport())).rejects.toThrow();
    expect(timer.pendingCount()).toBe(0);
  });

  it('rejects and aborts the request when no answer comes within 5 s, not before', async () => {
    const timer = fakeSchedule();
    let signal: AbortSignal | null | undefined;
    const fetch: ReportFetch = (_url, init) => {
      signal = init.signal;
      return new Promise(() => undefined);
    };
    let outcome = 'pending';
    const saving = new DevServerReportWriter({ fetch, schedule: timer.schedule })
      .save(fakeErrorReport())
      .then(
        () => (outcome = 'saved'),
        (error: unknown) => (outcome = String(error)),
      );

    timer.advance(REPORT_TIMEOUT_MS - 1);
    await flushMicrotasks();
    expect(outcome).toBe('pending');
    expect(signal?.aborted).toBe(false);

    timer.advance(1);
    await saving;
    expect(REPORT_TIMEOUT_MS).toBe(5000);
    expect(outcome).toBe('Error: No answer within 5000 ms');
    expect(signal?.aborted).toBe(true);
  });

  it('cancels the timeout once the server answers', async () => {
    const timer = fakeSchedule();
    const server = fakeServer();

    await new DevServerReportWriter({ fetch: server.fetch, schedule: timer.schedule }).save(
      fakeErrorReport(),
    );

    expect(timer.pendingCount()).toBe(0);
  });
});
