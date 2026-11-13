import { describe, expect, it } from 'vitest';
import { ServerConfig } from './ServerConfig';

describe('ServerConfig', () => {
  it('defaults to loopback on 8787', () => {
    expect(new ServerConfig({}).duelListener()).toEqual({ host: '127.0.0.1', port: 8787 });
  });

  it('reads DUEL_HOST and DUEL_PORT', () => {
    expect(new ServerConfig({ DUEL_HOST: '0.0.0.0', DUEL_PORT: '9000' }).duelListener()).toEqual({
      host: '0.0.0.0',
      port: 9000,
    });
  });

  it('refuses a bad port', () => {
    expect(() => new ServerConfig({ DUEL_PORT: 'abc' }).duelListener()).toThrow('DUEL_PORT');
    expect(() => new ServerConfig({ DUEL_PORT: '70000' }).duelListener()).toThrow('DUEL_PORT');
  });

  it('puts the health server on 8788, or on OPS_PORT', () => {
    expect(new ServerConfig({}).opsListener()).toEqual({ host: '127.0.0.1', port: 8788 });
    expect(new ServerConfig({ OPS_PORT: '9001' }).opsListener().port).toBe(9001);
    expect(() => new ServerConfig({ OPS_PORT: '0' }).opsListener()).toThrow('OPS_PORT');
  });
});
