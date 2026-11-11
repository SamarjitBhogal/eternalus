import { describe, expect, it } from 'vitest';

import type { UiImageEntry } from '../AssetManifest.types';
import { describeAssetLoader } from './AssetLoader.contract';
import { FakeAssetLoader } from './FakeAssetLoader';

const ENTRY: UiImageEntry = {
  id: 'test-image',
  type: 'ui-image',
  group: 'selection',
  file: { url: '/assets/test-image.webp', bytes: 10, hash: 'a'.repeat(64) },
  licence: 'owner',
  source: 'test fixture',
};

describeAssetLoader('FakeAssetLoader', () => {
  const loader = new FakeAssetLoader({ failingUrls: ['/bad.webp'], shouldSettleAtOnce: true });
  return {
    loader,
    goodEntry: ENTRY,
    goodUrl: '/good.webp',
    badEntry: ENTRY,
    badUrl: '/bad.webp',
    isHeld: (handle) => loader.isHeld(handle),
  };
});

describe('FakeAssetLoader', () => {
  it('keeps loads pending until resolveAll, then settles them in call order', async () => {
    const loader = new FakeAssetLoader();
    const settled: string[] = [];

    const first = loader.load(ENTRY, '/first.webp').then((handle) => settled.push(handle.url));
    const second = loader.load(ENTRY, '/second.webp').then((handle) => settled.push(handle.url));
    await Promise.resolve();
    const before = [...settled];
    const pendingBefore = loader.pendingCount;
    loader.resolveAll();
    await Promise.all([first, second]);

    expect({ before, pendingBefore, settled, pendingAfter: loader.pendingCount }).toEqual({
      before: [],
      pendingBefore: 2,
      settled: ['/first.webp', '/second.webp'],
      pendingAfter: 0,
    });
  });

  it('records every call with its entry and url', () => {
    const loader = new FakeAssetLoader({ type: 'font' });

    void loader.load(ENTRY, '/a.woff2');

    expect({ type: loader.type, calls: loader.calls }).toEqual({
      type: 'font',
      calls: [{ entry: ENTRY, url: '/a.woff2' }],
    });
  });

  it('rejects a failing url when settled', async () => {
    const loader = new FakeAssetLoader({ failingUrls: ['/bad.webp'] });

    const load = loader.load(ENTRY, '/bad.webp');
    loader.resolveAll();

    await expect(load).rejects.toThrow('fake load of /bad.webp failed');
  });
});
