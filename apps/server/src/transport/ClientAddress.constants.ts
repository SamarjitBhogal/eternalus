/** Peer addresses of the local reverse proxy, the only peers whose `X-Forwarded-For` is trusted. */
export const LOOPBACK_ADDRESSES: ReadonlySet<string> = new Set([
  '127.0.0.1',
  '::1',
  '::ffff:127.0.0.1',
]);

/** The header a reverse proxy puts the real client address in. */
export const FORWARDED_FOR_HEADER = 'x-forwarded-for';

/** The address used when the peer address is unknown. */
export const UNKNOWN_ADDRESS = 'unknown';
