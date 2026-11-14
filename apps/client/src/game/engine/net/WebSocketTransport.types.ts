/** The part of a browser `WebSocket` the transport uses; a `WebSocket` satisfies it. */
export interface SocketApi {
  readonly readyState: number;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  send(data: string): void;
  close(): void;
}

/** Opens a socket to `url`; the default is the browser's `new WebSocket(url)`. */
export type SocketFactory = (url: string) => SocketApi;
