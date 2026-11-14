import { createServer } from 'node:net';
import { describe, expect, it } from 'vitest';
import { ConnectionLimiter } from '../limits/ConnectionLimiter';
import { MAX_WS_PAYLOAD_BYTES, WS_TRY_AGAIN_LATER } from './WsListener.constants';
import { WsListener } from './WsListener';

const HOST = '127.0.0.1';

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, HOST, () => {
      const address = probe.address();
      const port = typeof address === 'object' && address !== null ? address.port : 0;
      probe.close(() => {
        resolve(port);
      });
    });
  });
}

describe('WsListener', () => {
  it('refuses a client past the cap with 1013 and survives a bad frame sent while it closes', async () => {
    const port = await freePort();
    const listener = new WsListener({ host: HOST, port }, new ConnectionLimiter(0, 0));
    listener.listen(() => {
      throw new Error('a refused client must not be handed over');
    });
    const code = await new Promise<number>((resolve, reject) => {
      const client = new WebSocket(`ws://${HOST}:${String(port)}`);
      client.addEventListener('open', () => {
        // Larger than the payload limit: the server socket emits `error` while it is closing.
        client.send('x'.repeat(MAX_WS_PAYLOAD_BYTES + 1));
      });
      client.addEventListener('close', (event) => {
        resolve(event.code);
      });
      client.addEventListener('error', () => {
        reject(new Error('The client could not connect.'));
      });
    });
    await listener.close();
    expect([WS_TRY_AGAIN_LATER, 1006, 1009]).toContain(code);
  });

  it('close() resolves once the open sockets are gone, and again when nothing is listening', async () => {
    const port = await freePort();
    const listener = new WsListener({ host: HOST, port }, new ConnectionLimiter(5, 5));
    const accepted = new Promise<void>((resolve) => {
      listener.listen(() => {
        resolve();
      });
    });
    const client = new WebSocket(`ws://${HOST}:${String(port)}`);
    const closed = new Promise<void>((resolve) => {
      client.addEventListener('close', () => {
        resolve();
      });
    });
    await accepted;
    await listener.close();
    await closed;
    await expect(listener.close()).resolves.toBeUndefined();
  });
});
