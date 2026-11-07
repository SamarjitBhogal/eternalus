import { describe, expect, it, vi } from 'vitest';

import type { AssetGroup } from '../../../bridge/events';
import type { DisplayCatalogue } from '../../../bridge/catalogue.types';
import { shippedCatalogue } from '../../content/__fixtures__/shippedCatalogue';
import { flushMicrotasks, testSession } from '../../testSessionDeps';

/** A session in the menu whose bus records every load event and phase, in order. */
async function inMenu(catalogue: Partial<DisplayCatalogue> = {}) {
  const session = testSession({
    catalogue: { load: () => ({ ...shippedCatalogue().load(), ...catalogue }) },
  });
  const load = vi.spyOn(session.resources, 'load');
  session.controller.start();
  await session.resolveLoads();
  const log: string[] = [];
  session.bus.on('loading-progress', ({ group, status }) => log.push(`${status} ${group}`));
  session.bus.on('asset-urls', ({ group }) => log.push(`urls ${group}`));
  session.bus.on('session-phase', ({ phase }) => log.push(`phase ${phase}`));
  const requested = (): AssetGroup[] =>
    load.mock.calls.map(([group]) => group).filter((group) => group !== 'boot');
  return { ...session, log, requested };
}

describe('LoadingState', () => {
  it('reports each selection group loading, then ready with its URLs, then opens character select once', async () => {
    const session = await inMenu();
    session.intent({ kind: 'start-match' });
    await session.resolveLoads();

    const groups = [
      'selection',
      'selection-primary',
      'selection-raster',
      'selection-primary-raster',
    ];
    // Progress repeats as each asset loads; the order is what matters: loading … ready, URLs, next.
    const collapsed = session.log.filter((entry, index) => entry !== session.log[index - 1]);
    expect(collapsed).toEqual([
      'phase loading',
      ...groups.flatMap((group) => [`loading ${group}`, `ready ${group}`, `urls ${group}`]),
      'phase character-select',
    ]);
  });

  it('never finishes a load cancelled from loading', async () => {
    const session = await inMenu();
    session.intent({ kind: 'start-match' });
    session.intent({ kind: 'cancel-match' });
    expect(session.store.getState().session).toMatchObject({ phase: 'menu', reason: 'cancelled' });
    session.log.length = 0;

    session.loader.resolveAll();
    await flushMicrotasks();

    expect(session.log).toEqual([]);
    expect(session.controller.phase).toBe('menu');
  });

  it("requests only the groups of the catalogue's layout and effects renderer", async () => {
    const primary = await inMenu();
    primary.intent({ kind: 'start-match' });
    await primary.resolveLoads();
    expect(primary.requested()).not.toContain('selection-alternate');

    const alternate = await inMenu({ classSelectLayout: 'alternate' });
    alternate.intent({ kind: 'start-match' });
    await alternate.resolveLoads();
    expect(alternate.requested()).toEqual(['selection', 'selection-alternate', 'selection-raster']);

    const css = await inMenu({ effectsRenderer: 'css' });
    css.intent({ kind: 'start-match' });
    await css.resolveLoads();
    expect(css.requested()).toEqual(['selection', 'selection-primary']);
  });

  it('returns to the menu with load-failed and one error when a load rejects (a bug)', async () => {
    const session = await inMenu();
    vi.spyOn(session.resources, 'load').mockRejectedValue(new Error('loader bug'));
    session.intent({ kind: 'start-match' });
    await flushMicrotasks();

    expect(session.log).toEqual([
      'phase loading',
      'loading selection',
      'failed selection',
      'phase menu',
    ]);
    expect(session.store.getState().session.reason).toBe('load-failed');
    expect(session.logger.records.map(({ severityText, scope }) => [severityText, scope])).toEqual([
      ['ERROR', 'client.session'],
    ]);
  });

  it('opens character select within the same call when every group is already loaded', async () => {
    const session = await inMenu();
    for (const group of [
      'selection',
      'selection-primary',
      'selection-raster',
      'selection-primary-raster',
    ] as const) {
      const loading = session.resources.load(group, () => undefined);
      session.loader.resolveAll();
      await loading;
    }
    session.log.length = 0;

    session.intent({ kind: 'start-match' });

    expect(session.controller.phase).toBe('character-select');
    expect(session.log.filter((entry) => entry.startsWith('loading'))).toEqual([]);
  });
});
