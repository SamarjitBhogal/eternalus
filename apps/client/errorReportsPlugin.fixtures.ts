/** Shared setup of the error-reports plugin's tests: a fake request and response, a temp directory
 * and a handler over it. */
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import type { IncomingHttpHeaders } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { afterEach, beforeEach } from 'vitest';

import {
  createErrorReportsHandler,
  type ErrorReportsHandler,
  type ReportRequest,
  type ReportResponse,
} from './errorReportsPlugin.ts';
import { ERROR_REPORTS_PATH } from './src/data/logging/ErrorReport.constants.ts';

export const RECEIVED_AT = '2026-10-30T22:41:07.123Z';
export const SAVED_ID = '2026-10-30T22-41-07-123Z-crash-3f9a1c2e';
/** A small body limit, so the size tests stay small. */
export const LIMIT = 1024;
export const REPORT = {
  schemaVersion: 1,
  kind: 'crash',
  createdAtMs: 1,
  error: { message: 'boom', stack: null, source: 'game-loop' },
  note: null,
};

export type RequestOptions = {
  readonly method?: string;
  readonly url?: string;
  readonly peer?: string;
  readonly headers?: IncomingHttpHeaders;
  readonly body?: string | Iterable<Buffer>;
};

/** A request from the page: POST, loopback, `localhost:5173`, JSON; `options` change any of it. */
export function fakeRequest(options: RequestOptions = {}): ReportRequest {
  const { body = JSON.stringify(REPORT) } = options;
  return Object.assign(Readable.from(typeof body === 'string' ? [Buffer.from(body)] : body), {
    method: options.method ?? 'POST',
    url: options.url ?? ERROR_REPORTS_PATH,
    headers: { host: 'localhost:5173', 'content-type': 'application/json', ...options.headers },
    socket: { remoteAddress: options.peer ?? '127.0.0.1' },
  });
}

export type Result = {
  readonly status: number;
  readonly body: unknown;
  readonly headers: Readonly<Record<string, string>>;
  readonly isPassedOn: boolean;
};

/** Runs one request through `handler` and resolves with its answer, or with `next()`. */
export function call(handler: ErrorReportsHandler, request: ReportRequest): Promise<Result> {
  return new Promise((resolve) => {
    const headers: Record<string, string> = {};
    const response: ReportResponse = {
      statusCode: 0,
      setHeader: (name, value) => {
        headers[name.toLowerCase()] = value;
      },
      end: (text) => {
        const body: unknown = JSON.parse(text);
        resolve({ status: response.statusCode, body, headers, isPassedOn: false });
      },
    };
    handler(request, response, () => {
      resolve({ status: 0, body: null, headers, isPassedOn: true });
    });
  });
}

/** Lets a stream that is still flowing run on, without timers. */
export async function settleStreams(): Promise<void> {
  for (let turn = 0; turn < 50; turn += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

let root = '';

/** The temporary directory of the running test; empty outside one. */
export const tempRoot = (): string => root;

/** Gives each test of the calling file its own empty temporary directory (`tempRoot()`). */
export function useTempRoot(): void {
  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'eternalus-error-reports-'));
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });
}

/**
 * A handler over `<temp>/logs/errors` with a fixed clock, the ids 3f9a1c2e, 0badf00d, ... and a
 * body limit of `LIMIT` bytes.
 */
export function setUp(
  ids: readonly string[] = ['3f9a1c2e', '0badf00d', '12345678', 'abcdef01'],
  maxBodyBytes = LIMIT,
) {
  const dir = path.join(root, 'logs', 'errors');
  const lines: string[] = [];
  let drawn = 0;
  const handler = createErrorReportsHandler({
    dir,
    now: () => new Date(RECEIVED_AT),
    randomId: () => ids[drawn++ % ids.length] ?? '',
    log: (line) => lines.push(line),
    maxBodyBytes,
  });
  const files = async (): Promise<string[]> => readdir(dir).catch(() => []);
  const stored = async (id: string): Promise<unknown> =>
    JSON.parse(await readFile(path.join(dir, `${id}.json`), 'utf8'));
  const send = (options?: RequestOptions): Promise<Result> => call(handler, fakeRequest(options));
  return { dir, lines, handler, files, stored, send };
}

export const noteUrl = (id: string): string => `${ERROR_REPORTS_PATH}/${id}/note`;
