/** The header a reverse proxy puts the real client address in; the server trusts it from loopback. */
export const FORWARDED_FOR_HEADER = 'x-forwarded-for';

/** The first two bytes of the made-up addresses a load run spreads its sockets over. */
export const SPREAD_ADDRESS_PREFIX = '10.77';

/** Values one address byte takes. */
export const BYTE_RANGE = 256;
