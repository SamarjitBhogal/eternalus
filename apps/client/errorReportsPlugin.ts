import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import type { IncomingHttpHeaders } from 'node:http';
import path from 'node:path';
import type { Readable } from 'node:stream';

import type { Plugin } from 'vite';

import {
  ERROR_REPORTS_FOLDER,
  ERROR_REPORTS_PLUGIN_NAME,
  LOCAL_HOST_HEADER,
  LOOPBACK_PEERS,
  MAX_BODY_BYTES,
  REPORT_ID_BYTES,
  REPORT_ID_PATTERN,
} from './errorReportsPlugin.constants.ts';
import { ERROR_REPORTS_PATH, MAX_NOTE_CHARS } from './src/data/logging/ErrorReport.constants.ts';

/** A request as the handler reads it: Node's `IncomingMessage` in the servers, a stream in tests. */
export type ReportRequest = Readable & {
  readonly method?: string | undefined;
  readonly url?: string | undefined;
  readonly headers: IncomingHttpHeaders;
  readonly socket: { readonly remoteAddress?: string | undefined };
};

/** A response as the handler writes it (Node's `ServerResponse` in the servers). */
export type ReportResponse = {
  statusCode: number;
  setHeader(name: string, value: string): unknown;
  end(body: string): unknown;
};

/** A Connect middleware: answers the endpoint's paths and passes every other path to `next`. */
export type ErrorReportsHandler = (
  request: ReportRequest,
  response: ReportResponse,
  next: () => void,
) => void;

/** What the handler is built from; the plugin passes the real clock, random bytes and logger. */
export type ErrorReportsHandlerDeps = {
  /** Where reports are written (`<repo root>/logs/errors`); created on the first save. */
  readonly dir: string;
  /** The server's clock; `receivedAt` is its UTC ISO time. */
  readonly now: () => Date;
  /** 8 hex digits (`crypto.randomBytes(4)`): a new report's `id8`, a note's temporary file name. */
  readonly randomId: () => string;
  /** Prints one line per saved report (Vite's logger). */
  readonly log: (line: string) => void;
  /** The largest body read; `MAX_BODY_BYTES` unless a test sets a small one. */
  readonly maxBodyBytes?: number;
};

/** What the server's middlewares and logger look like to the plugin (dev and preview server). */
type ReportServer = {
  readonly middlewares: { use(handler: ErrorReportsHandler): unknown };
  readonly config: { readonly logger: { info(message: string): void } };
};

type Answer = {
  readonly status: number;
  readonly body: Readonly<Record<string, string>>;
  /** Closes the connection after the answer, so an unread body is never read (413). */
  readonly isClosing?: boolean;
};

type Route = { readonly kind: 'save' } | { readonly kind: 'note'; readonly id: string };

const refused = (status: number, error: string): Answer => ({ status, body: { error } });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * The trust checks, in ADR 0025 §2's order: `POST` (405), a loopback peer (403), a local `Host`
 * (403, DNS rebinding) and, when sent, an `Origin` equal to `http://` + `Host` (403).
 */
function refuseUntrusted(request: ReportRequest): Answer | null {
  if (request.method !== 'POST') return refused(405, 'only POST is allowed');
  if (!LOOPBACK_PEERS.has(request.socket.remoteAddress ?? '')) {
    return refused(403, 'the peer is not loopback');
  }
  const { host, origin } = request.headers;
  if (host === undefined || !LOCAL_HOST_HEADER.test(host)) return refused(403, 'foreign Host');
  if (origin !== undefined && origin !== `http://${host}`) return refused(403, 'foreign Origin');
  return null;
}

/** The route for a path under the endpoint; a note id must match `REPORT_ID_PATTERN` exactly. */
function routeOf(urlPath: string): Route | null {
  if (urlPath === ERROR_REPORTS_PATH) return { kind: 'save' };
  const [id, rest, ...extra] = urlPath.slice(ERROR_REPORTS_PATH.length + 1).split('/');
  if (id === undefined || rest !== 'note' || extra.length > 0 || !REPORT_ID_PATTERN.test(id)) {
    return null;
  }
  return { kind: 'note', id };
}

const isJson = (contentType: string | undefined): boolean =>
  (contentType ?? '').split(';')[0]?.trim().toLowerCase() === 'application/json';

/** Reads the body; stops reading (pauses) and resolves `null` once it passes `maxBytes`. */
function readBody(request: ReportRequest, maxBytes: number): Promise<Buffer | null> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const stop = (): void => {
      request.off('data', onData);
      request.off('end', onEnd);
      request.off('error', onError);
    };
    const onData = (chunk: Buffer | string): void => {
      const bytes = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      size += bytes.length;
      if (size > maxBytes) {
        stop();
        request.pause();
        resolve(null);
        return;
      }
      chunks.push(bytes);
    };
    const onEnd = (): void => {
      stop();
      resolve(Buffer.concat(chunks));
    };
    const onError = (error: Error): void => {
      stop();
      reject(error);
    };
    request.on('data', onData);
    request.on('end', onEnd);
    request.on('error', onError);
  });
}

/** The shape the server checks, and nothing more: `schemaVersion` 1, a kind, a string message. */
const isReport = (value: unknown): value is Record<string, unknown> & { kind: string } =>
  isRecord(value) &&
  value.schemaVersion === 1 &&
  (value.kind === 'crash' || value.kind === 'error') &&
  isRecord(value.error) &&
  typeof value.error.message === 'string';

const fileOf = (id: string): string => `${ERROR_REPORTS_FOLDER}/${id}.json`;

/** Writes a new report under a name the server picks; `wx` never overwrites. */
async function save(deps: ErrorReportsHandlerDeps, report: unknown): Promise<Answer> {
  if (!isReport(report)) return refused(400, 'not an error report');
  const receivedAt = deps.now().toISOString();
  const id = `${receivedAt.replace(/[:.]/g, '-')}-${report.kind}-${deps.randomId()}`;
  await mkdir(deps.dir, { recursive: true });
  const text = JSON.stringify({ ...report, receivedAt }, null, 2);
  await writeFile(path.join(deps.dir, `${id}.json`), text, { flag: 'wx' });
  deps.log(`error report saved: ${fileOf(id)}`);
  return { status: 201, body: { id, file: fileOf(id) } };
}

/** Sets the note of the saved report `id`: reads it, writes a temporary file, renames it over. */
async function addNote(deps: ErrorReportsHandlerDeps, id: string, body: unknown): Promise<Answer> {
  if (!isRecord(body) || typeof body.note !== 'string' || body.note.length > MAX_NOTE_CHARS) {
    return refused(400, `not a note of at most ${String(MAX_NOTE_CHARS)} characters`);
  }
  const target = path.join(deps.dir, `${id}.json`);
  let text: string;
  try {
    text = await readFile(target, 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return refused(404, 'no such report');
    }
    throw error;
  }
  const stored: unknown = JSON.parse(text);
  if (!isRecord(stored)) throw new Error(`${id} does not hold a report`);
  const temporary = path.join(deps.dir, `${id}.${deps.randomId()}.tmp`);
  await writeFile(temporary, JSON.stringify({ ...stored, note: body.note }, null, 2), {
    flag: 'wx',
  });
  try {
    await rename(temporary, target);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
  return { status: 200, body: { id, file: fileOf(id) } };
}

async function answer(
  deps: ErrorReportsHandlerDeps,
  request: ReportRequest,
  urlPath: string,
): Promise<Answer> {
  const refusal = refuseUntrusted(request);
  if (refusal !== null) return refusal;
  const route = routeOf(urlPath);
  if (route === null) return refused(404, 'no such report');
  if (!isJson(request.headers['content-type'])) return refused(415, 'the body must be JSON');
  const body = await readBody(request, deps.maxBodyBytes ?? MAX_BODY_BYTES);
  if (body === null) return { ...refused(413, 'the body is too large'), isClosing: true };
  let parsed: unknown;
  try {
    parsed = JSON.parse(body.toString('utf8'));
  } catch {
    return refused(400, 'the body is not JSON');
  }
  return route.kind === 'save' ? save(deps, parsed) : addNote(deps, route.id, parsed);
}

function send(response: ReportResponse, { status, body, isClosing }: Answer): void {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json');
  if (isClosing === true) response.setHeader('Connection', 'close');
  response.end(JSON.stringify(body));
}

/**
 * The endpoint (ADR 0025 §2) as a plain Node middleware: `POST /__eternalus/error-reports` saves a
 * report (`201 { id, file }`), `POST /__eternalus/error-reports/<id>/note` sets its note (`200`).
 * Every request under the path passes the trust checks first; a failed write answers `500`. It
 * never takes a path from the body. Other paths go to `next()`.
 */
export function createErrorReportsHandler(deps: ErrorReportsHandlerDeps): ErrorReportsHandler {
  return (request, response, next) => {
    const urlPath = (request.url ?? '').split('?')[0] ?? '';
    if (urlPath !== ERROR_REPORTS_PATH && !urlPath.startsWith(`${ERROR_REPORTS_PATH}/`)) {
      next();
      return;
    }
    answer(deps, request, urlPath).then(
      (result) => {
        send(response, result);
      },
      () => {
        send(response, refused(500, 'the report could not be written'));
      },
    );
  };
}

/** Adds the endpoint to a dev or preview server: one middleware, logging through Vite's logger. */
export function attachErrorReports(server: ReportServer, dir: string): void {
  server.middlewares.use(
    createErrorReportsHandler({
      dir,
      now: () => new Date(),
      randomId: () => randomBytes(REPORT_ID_BYTES).toString('hex'),
      log: (line) => {
        server.config.logger.info(line);
      },
    }),
  );
}

/**
 * Error reports through the local dev server (ADR 0025 §1, DEC-116): `vite` and `vite preview`
 * take reports into `dir`. `vite build` never calls these hooks, so `dist/` has no endpoint.
 */
export function errorReportsPlugin({ dir }: { readonly dir: string }): Plugin {
  return {
    name: ERROR_REPORTS_PLUGIN_NAME,
    configureServer: (server) => {
      attachErrorReports(server, dir);
    },
    configurePreviewServer: (server) => {
      attachErrorReports(server, dir);
    },
  };
}
