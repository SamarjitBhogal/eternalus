/** The part of a `ws` WebSocket that `WsConnection` uses, so it is tested without a socket. */
export interface WsSocketLike {
  /** `1` (OPEN) while messages can be sent. */
  readonly readyState: number;
  send(data: string): void;
  close(): void;
  ping(): void;
  terminate(): void;
  on(
    event: 'message',
    listener: (data: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => void,
  ): unknown;
  on(event: 'close' | 'error' | 'pong', listener: () => void): unknown;
}
