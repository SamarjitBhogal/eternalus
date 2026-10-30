import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { useExplorerChrome } from './useExplorerChrome';

/** Renders the hook once on the server and hands back what it returned. */
function renderHook(isExplorerShownAtStart = false): ReturnType<typeof useExplorerChrome> {
  const result: { current: ReturnType<typeof useExplorerChrome> | null } = { current: null };
  function Probe(): ReactElement {
    result.current = useExplorerChrome(isExplorerShownAtStart);
    return <i />;
  }
  renderToStaticMarkup(<Probe />);
  if (result.current === null) throw new Error('the probe did not render');
  return result.current;
}

describe('useExplorerChrome', () => {
  it('starts outside the cathedral', () => {
    expect(renderHook().isInterior).toBe(false);
  });

  it('starts with the developer explorer as the viewport starts it (?dev=1; DEC-105)', () => {
    expect(renderHook(false).isExplorerShown).toBe(false);
    expect(renderHook(true).isExplorerShown).toBe(true);
  });

  it('runs the overview the match gave it, and nothing once it is taken back', () => {
    const { chrome, overview } = renderHook();
    const run = vi.fn();
    overview();
    chrome.setOverview(run);
    overview();
    chrome.setOverview(null);
    overview();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('runs the leave action the match gave it, and nothing once it is taken back', () => {
    const { chrome, leaveInterior } = renderHook();
    const run = vi.fn();
    chrome.setLeaveInterior(run);
    leaveInterior();
    chrome.setLeaveInterior(null);
    leaveInterior();
    expect(run).toHaveBeenCalledTimes(1);
  });
});
