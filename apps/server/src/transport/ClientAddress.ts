import {
  FORWARDED_FOR_HEADER,
  LOOPBACK_ADDRESSES,
  UNKNOWN_ADDRESS,
} from './ClientAddress.constants';

/**
 * Resolves the address a connection cap is keyed on (ADR 0016 point 7). Behind the local reverse
 * proxy (`tailscale serve`) the peer is loopback, so the first `X-Forwarded-For` entry is the
 * client; from any other peer the header is client-controlled and never read.
 */
export class ClientAddress {
  /**
   * @param remoteAddress The socket's peer address.
   * @param headers The upgrade request's headers.
   */
  public resolve(
    remoteAddress: string | undefined,
    headers: Readonly<Record<string, string | string[] | undefined>>,
  ): string {
    if (remoteAddress === undefined) return UNKNOWN_ADDRESS;
    if (!LOOPBACK_ADDRESSES.has(remoteAddress)) return remoteAddress;
    const raw = headers[FORWARDED_FOR_HEADER];
    const first = (Array.isArray(raw) ? raw[0] : raw)?.split(',')[0]?.trim();
    return first === undefined || first === '' ? remoteAddress : first;
  }
}
