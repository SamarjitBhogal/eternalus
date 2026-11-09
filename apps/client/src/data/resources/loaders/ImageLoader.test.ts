import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImageLoader } from './ImageLoader';

afterEach(() => vi.unstubAllGlobals());
describe('ImageLoader', () => {
  it('resolves loaded images and rejects decode failures', async () => {
    const pending = { onload: (): void => undefined, onerror: (): void => undefined, src: '' };
    vi.stubGlobal(
      'Image',
      vi.fn(function () {
        return pending;
      }),
    );
    const loader = new ImageLoader();
    const success = loader.load('hero.png');
    expect(pending.src).toBe('hero.png');
    pending.onload();
    await expect(success).resolves.toBe(pending);
    const failure = loader.load('bad.png');
    pending.onerror();
    await expect(failure).rejects.toThrow('Unable to load image: bad.png');
  });
});
