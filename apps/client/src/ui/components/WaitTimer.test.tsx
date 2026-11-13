// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WaitTimer } from './WaitTimer';

describe('WaitTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at 00:00 with its label', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
      root.render(<WaitTimer label="Waiting" />);
    });
    expect(container.textContent).toBe('00:00');
    expect(container.querySelector('[role="timer"]')?.getAttribute('aria-label')).toBe('Waiting');
    act(() => {
      root.unmount();
    });
  });

  it('advances with the clock', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
      root.render(<WaitTimer label="Waiting" />);
    });
    act(() => {
      vi.advanceTimersByTime(65_000);
    });
    expect(container.textContent).toBe('01:05');
    act(() => {
      root.unmount();
    });
  });
});
