import type { ClientMessage, RejectReason } from './messages.types';

/** A parsed message, or why it was refused. */
export type ParseResult =
  | { readonly ok: true; readonly message: ClientMessage }
  | { readonly ok: false; readonly reason: Extract<RejectReason, 'malformed' | 'too-large'> };
