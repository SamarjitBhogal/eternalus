import { describe, expect, it } from 'vitest';
import { ClientAddress } from './ClientAddress';

const address = new ClientAddress();

describe('ClientAddress', () => {
  it('takes the first X-Forwarded-For entry from a loopback peer', () => {
    for (const peer of ['127.0.0.1', '::1', '::ffff:127.0.0.1']) {
      expect(address.resolve(peer, { 'x-forwarded-for': '100.1.1.1, 10.0.0.1' })).toBe('100.1.1.1');
    }
    expect(address.resolve('127.0.0.1', { 'x-forwarded-for': ['100.1.1.2'] })).toBe('100.1.1.2');
  });

  it('falls back to the peer when the header is missing or empty', () => {
    expect(address.resolve('127.0.0.1', {})).toBe('127.0.0.1');
    expect(address.resolve('127.0.0.1', { 'x-forwarded-for': '' })).toBe('127.0.0.1');
    expect(address.resolve('127.0.0.1', { 'x-forwarded-for': [] })).toBe('127.0.0.1');
  });

  it('ignores the header from a non-loopback peer', () => {
    expect(address.resolve('203.0.113.9', { 'x-forwarded-for': '1.2.3.4' })).toBe('203.0.113.9');
  });

  it('answers unknown without a peer address', () => {
    expect(address.resolve(undefined, { 'x-forwarded-for': '1.2.3.4' })).toBe('unknown');
  });
});
