import { chmod, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { REPORT_ID_PATTERN } from './errorReportsPlugin.constants.ts';
import {
  call,
  fakeRequest,
  noteUrl,
  RECEIVED_AT,
  REPORT,
  type RequestOptions,
  SAVED_ID,
  setUp,
  tempRoot,
  useTempRoot,
} from './errorReportsPlugin.fixtures.ts';
import {
  attachErrorReports,
  type ErrorReportsHandler,
  errorReportsPlugin,
} from './errorReportsPlugin.ts';
import { ERROR_REPORTS_PATH, MAX_NOTE_CHARS } from './src/data/logging/ErrorReport.constants.ts';

useTempRoot();

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
    const secret = path.join(tempRoot(), 'logs', 'secret.json');
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
    const plugin = errorReportsPlugin({ dir: tempRoot() });

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
    const dir = path.join(tempRoot(), 'logs', 'errors');

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
