import { describe, expect, it, vi } from 'vitest';
import { ResourceController } from './ResourceController';
import { SpriteAtlasLoader } from './loaders/SpriteAtlasLoader';

describe('ResourceController world atlases', () => {
  it('shares the decoded atlas until match release, then closes and forgets it', async () => {
    const image = { width: 384, height: 640, close: vi.fn() },
      decode = vi.fn(() => Promise.resolve(image));
    const resources = new ResourceController({
      manifest: {
        version: '1',
        assets: [
          {
            id: 'oracle-sprites',
            type: 'sprite-atlas',
            columns: 6,
            rows: 10,
            group: 'match',
            file: { url: 'sheet.webp', bytes: 100, hash: 'test' },
            licence: 'owner',
            source: 'owner reference',
          },
        ],
      },
      loaders: [new SpriteAtlasLoader(decode)],
      pixelRatio: () => 1,
      warn: vi.fn(),
    });
    expect(resources.atlases('match')).toEqual({});
    await Promise.all([
      resources.load('match', () => undefined),
      resources.load('match', () => undefined),
    ]);
    expect(decode).toHaveBeenCalledOnce();
    const atlas = resources.atlases('match')['oracle-sprites'];
    expect(atlas?.image).toBe(image);
    expect(resources.atlases('match')['oracle-sprites']).toBe(atlas);
    expect(resources.urls('match')).toEqual({});
    resources.release('match');
    expect(image.close).toHaveBeenCalledOnce();
    expect(resources.atlases('match')).toEqual({});
  });
});
