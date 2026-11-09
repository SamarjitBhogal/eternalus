import { describe, expect, it, vi } from 'vitest';
import { ResourceController } from './ResourceController';

describe('ResourceController', () => {
  it('caches in-flight and decoded assets', async () => {
    const image = {} as HTMLImageElement;
    const load = vi.fn().mockResolvedValue(image);
    const resources = new ResourceController({ load });
    const first = resources.loadImage('hero');
    expect(resources.loadImage('hero')).toBe(first);
    expect(await first).toBe(image);
    expect(await resources.loadImage('hero')).toBe(image);
    expect(load).toHaveBeenCalledTimes(1);
  });
  it('allows retry after failure', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('decode')).mockResolvedValueOnce({});
    const resources = new ResourceController({ load });
    await expect(resources.loadImage('hero')).rejects.toThrow('decode');
    await expect(resources.loadImage('hero')).resolves.toEqual({});
    expect(load).toHaveBeenCalledTimes(2);
  });
});
