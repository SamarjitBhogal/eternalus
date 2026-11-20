import { describe, expect, it, vi } from 'vitest';
import { SpriteAtlasLoader } from './SpriteAtlasLoader';
import type { SpriteAtlasEntry } from '../AssetManifest.types';

const entry: SpriteAtlasEntry = {
  id: 'oracle-sprites',
  type: 'sprite-atlas',
  group: 'match',
  columns: 6,
  rows: 10,
  licence: 'owner',
  source: 'Generated from owner art',
  file: { url: 'sheet.webp', bytes: 1, hash: 'test' },
};
describe('SpriteAtlasLoader', () => {
  it('decodes the grid once and closes its bitmap on release', async () => {
    const image = { width: 384, height: 640, close: vi.fn() },
      decode = vi.fn(() => Promise.resolve(image)),
      loader = new SpriteAtlasLoader(decode);
    const atlas = await loader.load(entry, 'sheet.webp');
    expect(decode).toHaveBeenCalledWith('sheet.webp');
    expect(atlas).toMatchObject({ columns: 6, rows: 10, image });
    loader.release(atlas);
    expect(image.close).toHaveBeenCalledOnce();
  });
  it('closes malformed grids and rejects them at the boundary', async () => {
    const image = { width: 385, height: 640, close: vi.fn() },
      loader = new SpriteAtlasLoader(() => Promise.resolve(image));
    await expect(loader.load(entry, 'bad.webp')).rejects.toThrow('Invalid sprite grid');
    expect(image.close).toHaveBeenCalledOnce();
  });
  it('rejects a different asset type without starting a decode', async () => {
    const decode = vi.fn(() => Promise.resolve({ width: 384, height: 640, close: vi.fn() })),
      loader = new SpriteAtlasLoader(decode);
    await expect(loader.load({ ...entry, type: 'ui-image' }, 'bad.webp')).rejects.toThrow(
      'sprite-atlas',
    );
    expect(decode).not.toHaveBeenCalled();
  });
});
