import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecordingRenderer } from './engine/render/RecordingRenderer';
import { useMatch } from './useMatch';
import { SinkLogger } from '../data/logging/SinkLogger';
const hooks = vi.hoisted(() => ({
  setState: vi.fn(),
  cleanup: undefined as (() => void) | undefined,
}));
vi.mock('./createMatchSeed', () => ({ createMatchSeed: () => 1 }));
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  useState: (initial: boolean) => [initial, hooks.setState],
  useRef: (initial: unknown) => ({ current: initial }),
  useEffect: (effect: () => (() => void) | undefined) => {
    hooks.cleanup = effect();
  },
}));
vi.mock('./engine/render/Canvas2dRenderer', () => ({
  Canvas2dRenderer: { fromCanvas: () => new RecordingRenderer() },
}));
describe('useMatch roof toolbar', () => {
  afterEach(() => {
    hooks.cleanup?.();
    hooks.cleanup = undefined;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });
  it('clears the toolbar flag when a second click closes the final roof', () => {
    vi.stubGlobal(
      'window',
      Object.assign(new EventTarget(), {
        devicePixelRatio: 1,
        requestAnimationFrame: () => 1,
        cancelAnimationFrame: vi.fn(),
      }),
    );
    vi.stubGlobal('document', new EventTarget());
    const canvas = Object.assign(new EventTarget(), {
      width: 1280,
      height: 720,
      clientWidth: 1280,
      clientHeight: 720,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
      setPointerCapture: vi.fn(),
      hasPointerCapture: () => false,
    });
    const log = vi.spyOn(SinkLogger.prototype, 'log');
    useMatch({ current: canvas as unknown as HTMLCanvasElement });
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: 'client.match',
        attributes: { seed: 1 },
      }),
    );
    const click = (): void => {
      canvas.dispatchEvent(
        Object.assign(new Event('pointerdown'), {
          button: 0,
          pointerId: 1,
          clientX: 640,
          clientY: 360,
        }),
      );
      canvas.dispatchEvent(
        Object.assign(new Event('pointerup'), {
          button: 0,
          pointerId: 1,
          clientX: 640,
          clientY: 360,
        }),
      );
    };
    click();
    expect(hooks.setState).toHaveBeenLastCalledWith(true);
    click();
    expect(hooks.setState).toHaveBeenLastCalledWith(false);
  });
});
