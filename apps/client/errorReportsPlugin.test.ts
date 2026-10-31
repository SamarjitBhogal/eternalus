import { chmod, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import type { IncomingHttpHeaders } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  attachErrorReports,
  createErrorReportsHandler,
  type ErrorReportsHandler,
  errorReportsPlugin,
  type ReportRequest,
  type ReportResponse,
} from './errorReportsPlugin.ts';
import { REPORT_ID_PATTERN } from './errorReportsPlugin.constants.ts';
import { ERROR_REPORTS_PATH, MAX_NOTE_CHARS } from './src/data/logging/ErrorReport.constants.ts';

const RECEIVED_AT = '2026-10-30T22:41:07.123Z';
const SAVED_ID = '2026-10-30T22-41-07-123Z-crash-3f9a1c2e';
/** A small body limit, so the size tests stay small. */
const LIMIT = 1024;
const REPORT = {
  schemaVersion: 1,
  kind: 'crash',
  createdAtMs: 1,
  error: { message: 'boom', stack: null, source: 'game-loop' },
  note: null,
};

type RequestOptions = {
  readonly method?: string;
  readonly url?: string;
  readonly peer?: string;
  readonly headers?: IncomingHttpHeaders;
  readonly body?: string | Iterable<Buffer>;
};

/** A request from the page: POST, loopback, `localhost:5173`, JSON; `options` change any of it. */
function fakeRequest(options: RequestOptions = {}): ReportRequest {
  const { body = JSON.stringify(REPORT) } = options;
  return Object.assign(Readable.from(typeof body === 'string' ? [Buffer.from(body)] : body), {
    method: options.method ?? 'POST',
    url: options.url ?? ERROR_REPORTS_PATH,
    headers: { host: 'localhost:5173', 'content-type': 'application/json', ...options.headers },
    socket: { remoteAddress: options.peer ?? '127.0.0.1' },
  });
}

type Result = {
  readonly status: number;
  readonly body: unknown;
  readonly headers: Readonly<Record<string, string>>;
  readonly isPassedOn: boolean;
};

/** Runs one request through `handler` and resolves with its answer, or with `next()`. */
function call(handler: ErrorReportsHandler, request: ReportRequest): Promise<Result> {
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
async function settleStreams(): Promise<void> {
  for (let turn = 0; turn < 50; turn += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

let root = '';
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'eternalus-error-reports-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

/**
 * A handler over `<temp>/logs/errors` with a fixed clock, the ids 3f9a1c2e, 0badf00d, ... and a
 * body limit of `LIMIT` bytes.
 */
function setUp(
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

const noteUrl = (id: string): string => `${ERROR_REPORTS_PATH}/${id}/note`;

describe('errorReportsPlugin: saving a report', () => {
  it('answers 201 with the id and file, and writes the report plus receivedAt, 2-space JSON', async () => {
    const { send, files, dir, lines } = setUp();

    const result = await send({ body: JSON.stringify({ ...REPORT, receivedAt: 'forged' }) });

    expect(result).toMatchObject({
      status: 201,
      body: { id: SAVED_ID, file: `logs/errors/${SAVED_ID}.json` },
      headers: { 'content-type': 'application/json' },
    });
    expect(await files()).toEqual([`${SAVED_ID}.json`]);
    expect(await readFile(path.join(dir, `${SAVED_ID}.json`), 'utf8')).toBe(
      JSON.stringify({ ...REPORT, receivedAt: RECEIVED_AT }, null, 2),
    );
    expect(lines).toEqual([`error report saved: logs/errors/${SAVED_ID}.json`]);
  });

  it('names the file <receivedAt>-<kind>-<id8>.json, the pattern the note route accepts', async () => {
    const { send, files } = setUp(['0badf00d']);

    await send({ body: JSON.stringify({ ...REPORT, kind: 'error' }) });

    const [name = ''] = await files();
    expect(name).toBe('2026-10-30T22-41-07-123Z-error-0badf00d.json');
    expect(REPORT_ID_PATTERN.test(name.replace(/\.json$/, ''))).toBe(true);
  });

  it('never overwrites a report: the same name twice answers 500 and keeps the first', async () => {
    const { send, stored, lines } = setUp(['3f9a1c2e']);
    await send();

    const second = await send({ body: JSON.stringify({ ...REPORT, note: 'second' }) });

    expect(second).toMatchObject({ status: 500 });
    expect(await stored(SAVED_ID)).toMatchObject({ note: null });
    expect(lines).toHaveLength(1);
  });

  it.each([
    ['127.0.0.1', 'localhost:5173', undefined],
    ['::1', '[::1]:5173', 'http://[::1]:5173'],
    ['::ffff:127.0.0.1', '127.0.0.1:4173', 'http://127.0.0.1:4173'],
    ['127.0.0.1', 'localhost', 'http://localhost'],
  ])('saves from the loopback peer %s with Host %s and Origin %s', async (peer, host, origin) => {
    const { send } = setUp();
    const headers = origin === undefined ? { host } : { host, origin };

    expect(await send({ peer, headers })).toMatchObject({ status: 201 });
  });

  it('reads a body of exactly the limit', async () => {
    const { send } = setUp();
    const padded = { ...REPORT, pad: '' };
    const body = JSON.stringify({
      ...padded,
      pad: ' '.repeat(LIMIT - JSON.stringify(padded).length),
    });

    expect(body).toHaveLength(LIMIT);
    expect(await send({ body })).toMatchObject({ status: 201 });
  });
});

describe('errorReportsPlugin: refusals, in order', () => {
  const big = 'x'.repeat(LIMIT + 1);
  // Each request fails the named check and the next one: the first check's answer wins.
  it.each<[string, RequestOptions, number, string]>([
    [
      'the method, before the peer',
      { method: 'GET', peer: '10.0.0.2' },
      405,
      'only POST is allowed',
    ],
    [
      'the peer, before the Host',
      { peer: '192.168.1.5', headers: { host: 'evil.example' } },
      403,
      'the peer is not loopback',
    ],
    [
      'the Host, before the Origin',
      { headers: { host: 'evil.example:5173', origin: 'http://localhost:5173' } },
      403,
      'foreign Host',
    ],
    [
      'the Origin, before the route',
      { url: `${ERROR_REPORTS_PATH}/nothing`, headers: { origin: 'http://evil.example' } },
      403,
      'foreign Origin',
    ],
    [
      'the route, before the content type',
      { url: `${ERROR_REPORTS_PATH}/nothing`, headers: { 'content-type': 'text/plain' } },
      404,
      'no such report',
    ],
    [
      'the content type, before the size',
      { headers: { 'content-type': 'text/plain' }, body: big },
      415,
      'the body must be JSON',
    ],
    ['the size, before the JSON', { body: big }, 413, 'the body is too large'],
    ['the JSON, before the shape', { body: '{"schemaVersion": 2,' }, 400, 'the body is not JSON'],
    [
      'the shape',
      { body: JSON.stringify({ ...REPORT, schemaVersion: 2 }) },
      400,
      'not an error report',
    ],
  ])('refuses %s', async (_name, options, status, error) => {
    const { send, files } = setUp();

    expect(await send(options)).toMatchObject({ status, body: { error } });
    expect(await files()).toEqual([]);
  });

  it.each([
    ['a foreign name pointed at 127.0.0.1 (DNS rebinding)', 'evil.example:5173'],
    ['a name that only starts with localhost', 'localhost.evil.example:5173'],
    ['an empty Host', ''],
  ])('refuses %s as Host, even with a matching Origin', async (_name, host) => {
    const { send } = setUp();

    expect(await send({ headers: { host, origin: `http://${host}` } })).toMatchObject({
      status: 403,
      body: { error: 'foreign Host' },
    });
  });

  it.each(['null', 'https://localhost:5173', 'http://localhost:5174', 'http://evil.example'])(
    'refuses the Origin %s',
    async (origin) => {
      const { send } = setUp();

      expect(await send({ headers: { origin } })).toMatchObject({
        status: 403,
        body: { error: 'foreign Origin' },
      });
    },
  );

  it.each<[string, unknown]>([
    ['an array', [REPORT]],
    ['null', null],
    ['a string', 'report'],
    ['schemaVersion "1"', { ...REPORT, schemaVersion: '1' }],
    ['kind "warn"', { ...REPORT, kind: 'warn' }],
    ['no error', { ...REPORT, error: undefined }],
    ['a number as error.message', { ...REPORT, error: { message: 7 } }],
  ])('refuses %s as a report', async (_name, report) => {
    const { send } = setUp();

    expect(await send({ body: JSON.stringify(report) })).toMatchObject({
      status: 400,
      body: { error: 'not an error report' },
    });
  });

  it('stops reading at the limit, answers 413 and closes the connection', async () => {
    const { handler, files } = setUp();
    const total = 1000;
    let pulled = 0;
    function* chunks(): Generator<Buffer> {
      for (let index = 0; index < total; index += 1) {
        pulled += 1;
        yield Buffer.alloc(100, 0x20);
      }
    }
    const request = fakeRequest({ body: chunks() });

    const result = await call(handler, request);
    await settleStreams();

    expect(result).toMatchObject({ status: 413, headers: { connection: 'close' } });
    expect(request.isPaused()).toBe(true);
    expect(pulled).toBeLessThan(total);
    expect(await files()).toEqual([]);
  });
});

describe('errorReportsPlugin: routes', () => {
  it.each(['/', '/src/main.tsx', '/__eternalus/error-reportsX', '/__eternalus'])(
    'passes %s on to the next middleware',
    async (url) => {
      const { send } = setUp();

      expect(await send({ url })).toMatchObject({ isPassedOn: true });
    },
  );

  it('takes a save with a query string', async () => {
    const { send } = setUp();

    expect(await send({ url: `${ERROR_REPORTS_PATH}?from=page` })).toMatchObject({ status: 201 });
  });

  it.each([
    `${ERROR_REPORTS_PATH}/`,
    `${ERROR_REPORTS_PATH}/${SAVED_ID}`,
    `${noteUrl(SAVED_ID)}/more`,
    `${ERROR_REPORTS_PATH}/${SAVED_ID}/notes`,
  ])('refuses any other path under the endpoint (%s) with 404', async (url) => {
    const { send } = setUp();
    await send();

    expect(await send({ url, body: JSON.stringify({ note: 'n' }) })).toMatchObject({
      status: 404,
    });
  });
});

describe('errorReportsPlugin: notes', () => {
  it('sets the note by renaming a new file over the report, keeping the rest', async () => {
    const { send, stored, files, dir } = setUp();
    await send();
    // A read-only report: only a new file renamed over it can change it.
    await chmod(path.join(dir, `${SAVED_ID}.json`), 0o444);

    const result = await send({
      url: noteUrl(SAVED_ID),
      body: JSON.stringify({ note: 'I pressed LOCK IN' }),
    });

    expect(result).toMatchObject({
      status: 200,
      body: { id: SAVED_ID, file: `logs/errors/${SAVED_ID}.json` },
    });
    expect(await stored(SAVED_ID)).toEqual({
      ...REPORT,
      receivedAt: RECEIVED_AT,
      note: 'I pressed LOCK IN',
    });
    expect(await files()).toEqual([`${SAVED_ID}.json`]);
  });

  it('takes a note of exactly the limit and refuses one character more', async () => {
    const { send } = setUp(undefined, 4 * MAX_NOTE_CHARS);
    await send();
    const note = (length: number): RequestOptions => ({
      url: noteUrl(SAVED_ID),
      body: JSON.stringify({ note: 'n'.repeat(length) }),
    });

    expect(await send(note(MAX_NOTE_CHARS))).toMatchObject({ status: 200 });
    expect(await send(note(MAX_NOTE_CHARS + 1))).toMatchObject({ status: 400 });
  });

  it.each<[string, unknown]>([
    ['no note', {}],
    ['a number', { note: 7 }],
    ['an array', ['note']],
  ])('refuses %s as a note', async (_name, body) => {
    const { send, stored } = setUp();
    await send();

    expect(await send({ url: noteUrl(SAVED_ID), body: JSON.stringify(body) })).toMatchObject({
      status: 400,
    });
    expect(await stored(SAVED_ID)).toMatchObject({ note: null });
  });

  it('answers 404 for an id of the right pattern with no report', async () => {
    const { send } = setUp();

    expect(
      await send({ url: noteUrl(SAVED_ID), body: JSON.stringify({ note: 'n' }) }),
    ).toMatchObject({ status: 404, body: { error: 'no such report' } });
  });

  it.each([
    '..',
    '..%2Fsecret',
    '..%2F..%2Flogs%2Fsecret',
    '%2e%2e',
    SAVED_ID.toUpperCase(),
    `${SAVED_ID}.json`,
    `x${SAVED_ID}`,
  ])('refuses the id %s with 404 and touches no file', async (id) => {
    const { send, dir } = setUp();
    const secret = path.join(root, 'logs', 'secret.json');
    await mkdir(dir, { recursive: true });
    await writeFile(secret, '{"kept":true}');

    const result = await send({ url: noteUrl(id), body: JSON.stringify({ note: 'n' }) });

    expect(result).toMatchObject({ status: 404 });
    expect(await readFile(secret, 'utf8')).toBe('{"kept":true}');
  });

  it('refuses an id outside the pattern even when its file exists', async () => {
    const { send, dir } = setUp();
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'planted.json'), '{}');

    const result = await send({ url: noteUrl('planted'), body: JSON.stringify({ note: 'n' }) });

    expect(result).toMatchObject({ status: 404 });
    expect(await readFile(path.join(dir, 'planted.json'), 'utf8')).toBe('{}');
  });

  it('refuses a ../ path segment before the note', async () => {
    const { send } = setUp();

    expect(
      await send({ url: `${ERROR_REPORTS_PATH}/../secret/note`, body: '{"note":"n"}' }),
    ).toMatchObject({ status: 404 });
  });
});

describe('errorReportsPlugin: the Vite glue', () => {
  it('only hooks the dev and preview servers, so `vite build` has no endpoint', () => {
    const plugin = errorReportsPlugin({ dir: root });

    expect(Object.keys(plugin).sort()).toEqual([
      'configurePreviewServer',
      'configureServer',
      'name',
    ]);
    expect(plugin.name).toBe('eternalus:error-reports');
  });

  it('adds one middleware that saves under a random id and logs through the server', async () => {
    const use = vi.fn<(handler: ErrorReportsHandler) => void>();
    const info = vi.fn<(message: string) => void>();
    const dir = path.join(root, 'logs', 'errors');

    attachErrorReports({ middlewares: { use }, config: { logger: { info } } }, dir);
    const [handler] = use.mock.calls[0] ?? [];
    if (handler === undefined) throw new Error('no middleware added');
    const result = await call(handler, fakeRequest());

    expect(use).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ status: 201 });
    const [name = ''] = await readdir(dir);
    expect(REPORT_ID_PATTERN.test(name.replace(/\.json$/, ''))).toBe(true);
    expect(info.mock.calls).toEqual([[`error report saved: logs/errors/${name}`]]);
  });
});
