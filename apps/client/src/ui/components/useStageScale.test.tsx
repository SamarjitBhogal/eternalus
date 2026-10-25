import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { subscribeToResize, useStageScale, windowStageScale } from './useStageScale';

/** Renders what `useStageScale` returns. */
function ScaleProbe(): ReactElement {
  return <output>{useStageScale()}</output>;
}

/** A window stand-in: its inner size, and each listener added to or removed from it, in order. */
function fakeWindow(innerWidth: number, innerHeight: number) {
  const calls: (readonly [string, string, unknown])[] = [];
  return {
    calls,
    window: {
      innerWidth,
      innerHeight,
      addEventListener: (type: string, listener: unknown): void => {
        calls.push(['add', type, listener]);
      },
      removeEventListener: (type: string, listener: unknown): void => {
        calls.push(['remove', type, listener]);
      },
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useStageScale', () => {
  it('server-renders the artboard at its own size, without reading window', () => {
    expect(typeof globalThis.window).toBe('undefined');
    expect(renderToStaticMarkup(<ScaleProbe />)).toBe('<output>1</output>');
  });

  // The client hydrates against the server HTML, so its first snapshot is the server one too.
  it('server-renders at 1 even beside a 4K window', () => {
    vi.stubGlobal('window', fakeWindow(3840, 2160).window);

    expect(renderToStaticMarkup(<ScaleProbe />)).toBe('<output>1</output>');
  });

  it('fits the window: the inner size through fitStageScale, letterboxed by the tighter side', () => {
    vi.stubGlobal('window', fakeWindow(3840, 2160).window);
    expect(windowStageScale()).toBe(2);
    vi.stubGlobal('window', fakeWindow(1280, 720).window);
    expect(windowStageScale()).toBeCloseTo(2 / 3, 12);
    vi.stubGlobal('window', fakeWindow(1366, 768).window);
    expect(windowStageScale()).toBeCloseTo(768 / 1080, 12);
  });

  it('listens for resize and removes that same listener when unsubscribed', () => {
    const { calls, window } = fakeWindow(1920, 1080);
    vi.stubGlobal('window', window);
    const onResize = (): void => undefined;

    const unsubscribe = subscribeToResize(onResize);
    expect(calls).toEqual([['add', 'resize', onResize]]);
    unsubscribe();
    expect(calls).toEqual([
      ['add', 'resize', onResize],
      ['remove', 'resize', onResize],
    ]);
  });
});
