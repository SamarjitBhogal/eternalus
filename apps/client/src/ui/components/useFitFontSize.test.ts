import { afterEach, describe, expect, it, vi } from 'vitest';

import { fitFontSize, measureFitAfterLayout } from './useFitFontSize';

/** The panel title's fit on the Legend layout (OD-21e): Figma 96 px, floor 64, region 500 px. */
const LEGEND_TITLE = { designSize: 96, minSize: 64, maxWidth: 500 } as const;

describe('fitFontSize', () => {
  // Widths measured in Chrome at 96 px (WP-LEGEND audit r5, od21 baseline): Elarion 410 (the
  // Figma's 56:34), Veridan 422, Centurion 562, Juggernaut 607.
  it('keeps a Figma title at its design size: no fitted size', () => {
    expect(fitFontSize(410, 96, LEGEND_TITLE)).toBeNull();
    expect(fitFontSize(422, 96, LEGEND_TITLE)).toBeNull();
    expect(fitFontSize(500, 96, LEGEND_TITLE)).toBeNull();
  });

  it('shrinks a long title to whole px that fit the region', () => {
    expect(fitFontSize(562, 96, LEGEND_TITLE)).toBe(85);
    expect(fitFontSize(607, 96, LEGEND_TITLE)).toBe(79);
    expect(fitFontSize(501, 96, LEGEND_TITLE)).toBe(95);
    expect((562 * 85) / 96).toBeLessThanOrEqual(LEGEND_TITLE.maxWidth);
    expect((607 * 79) / 96).toBeLessThanOrEqual(LEGEND_TITLE.maxWidth);
  });

  it('never goes below the floor: a title too long even there overflows at 64 px', () => {
    expect(fitFontSize(900, 96, LEGEND_TITLE)).toBe(64);
    expect(fitFontSize(751, 96, LEGEND_TITLE)).toBe(LEGEND_TITLE.minSize);
  });

  // The hook measures at the computed size, which is the fitted size after a long title.
  it('measures from the rendered size, so the next title is fitted from its design width', () => {
    expect(fitFontSize((562 * 85) / 96, 85, LEGEND_TITLE)).toBe(85);
    expect(fitFontSize((607 * 85) / 96, 85, LEGEND_TITLE)).toBe(79);
    expect(fitFontSize((410 * 85) / 96, 85, LEGEND_TITLE)).toBeNull();
  });
});

/** A `ResizeObserver` stand-in: `report()` is the browser delivering the frame's observation. */
class FakeResizeObserver {
  static readonly created: FakeResizeObserver[] = [];
  readonly #callback: () => void;
  target: unknown = null;
  isConnected = false;
  constructor(callback: () => void) {
    this.#callback = callback;
    FakeResizeObserver.created.push(this);
  }
  observe(target: unknown): void {
    this.target = target;
    this.isConnected = true;
  }
  disconnect(): void {
    this.isConnected = false;
  }
  report(): void {
    if (this.isConnected) this.#callback();
  }
}

/** A title element whose layout reads (computed style, `scrollWidth`) are logged in order. */
function titleElement(scrollWidth: number, fontSize: string, reads: string[]): HTMLElement {
  vi.stubGlobal('getComputedStyle', () => {
    reads.push('getComputedStyle');
    return { fontSize };
  });
  const element = {
    get scrollWidth(): number {
      reads.push('scrollWidth');
      return scrollWidth;
    },
  };
  return element as unknown as HTMLElement;
}

// Measuring in the commit forced a synchronous style and layout of the whole step just mounted
// (the Legend step, inside Select Class's click); the fit is read after the browser's own layout.
describe('measureFitAfterLayout', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    FakeResizeObserver.created.length = 0;
  });

  it('reads no layout in the commit: it measures when the browser reports the element', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    const reads: string[] = [];
    const element = titleElement(562, '96px', reads);
    const fitted: (number | null)[] = [];

    measureFitAfterLayout(element, LEGEND_TITLE, (size) => fitted.push(size));

    expect(reads).toEqual([]);
    expect(fitted).toEqual([]);
    const [observer] = FakeResizeObserver.created;
    expect(observer?.target).toBe(element);
    observer?.report();
    expect(reads).toEqual(['getComputedStyle', 'scrollWidth']);
    expect(fitted).toEqual([85]);
  });

  it('disconnects before reporting, so the size change a fit causes is not observed again', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    const element = titleElement((607 * 85) / 96, '85px', []);
    const connectedWhenReported: boolean[] = [];

    measureFitAfterLayout(element, LEGEND_TITLE, () => {
      connectedWhenReported.push(FakeResizeObserver.created[0]?.isConnected ?? true);
    });
    FakeResizeObserver.created[0]?.report();
    FakeResizeObserver.created[0]?.report();

    expect(connectedWhenReported).toEqual([false]);
  });

  it('measures nothing once cancelled (the text changed or the panel unmounted first)', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    const reads: string[] = [];
    const fitted: (number | null)[] = [];

    const cancel = measureFitAfterLayout(titleElement(410, '96px', reads), LEGEND_TITLE, (size) =>
      fitted.push(size),
    );
    cancel();
    FakeResizeObserver.created[0]?.report();

    expect(FakeResizeObserver.created[0]?.isConnected).toBe(false);
    expect(reads).toEqual([]);
    expect(fitted).toEqual([]);
  });
});
