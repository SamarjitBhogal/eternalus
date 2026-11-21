import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { REPORT_ID_PATTERN } from './errorReportsPlugin.constants.ts';
import {
  call,
  fakeRequest,
  LIMIT,
  noteUrl,
  RECEIVED_AT,
  REPORT,
  type RequestOptions,
  SAVED_ID,
  setUp,
  settleStreams,
  useTempRoot,
} from './errorReportsPlugin.fixtures.ts';
import { ERROR_REPORTS_PATH } from './src/data/logging/ErrorReport.constants.ts';

useTempRoot();

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
