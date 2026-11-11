import { afterAll, afterEach, describe, expect, it } from 'vitest';

import { eventBus } from '../../bridge/eventBus';
import type { UiIntent } from '../../bridge/events';
import type { LegendCardView, LegendStepView } from '../../bridge/selectors/selectLegendStepView';
import { legendStepActions } from './legendStepActions';

const card = (specId: string, overrides: Partial<LegendCardView> = {}): LegendCardView => ({
  specId,
  subClassName: specId,
  legendName: null,
  roleLabel: null,
  description: null,
  accentToken: '--legend-oracle-accent',
  isAvailable: true,
  isPicked: false,
  cardArtAssetId: null,
  refractionArtAssetId: null,
  rowPlateAssetId: null,
  details: [],
  ratings: [],
  ...overrides,
});

const CATALYST = card('catalyst');
const ORACLE = card('oracle', { isPicked: true });
const NECROMANCER = card('necromancer', { isAvailable: false });

const view = (overrides: Partial<LegendStepView> = {}): LegendStepView => ({
  classId: 'magus',
  classDisplayName: 'Magus',
  legends: [CATALYST, ORACLE, NECROMANCER],
  pickedSpecId: 'oracle',
  canLockIn: true,
  ...overrides,
});

describe('legendStepActions', () => {
  const seen: UiIntent[] = [];
  const stop = eventBus.on('ui-intent', (intent) => seen.push(intent));
  afterEach(() => {
    seen.length = 0;
  });
  afterAll(stop);

  it('picks an available Legend with one select-class carrying class and Legend', () => {
    legendStepActions(view()).pick(CATALYST);

    expect(seen).toEqual([{ kind: 'select-class', classId: 'magus', specId: 'catalyst' }]);
  });

  it('emits nothing for the picked Legend or a locked one', () => {
    const actions = legendStepActions(view());
    actions.pick(ORACLE);
    actions.pick(NECROMANCER);

    expect(seen).toEqual([]);
  });

  it('moves with the arrows, wrapping, and picks where it lands (APG radio, I-14)', () => {
    const actions = legendStepActions(view({ legends: [CATALYST, ORACLE, card('third')] }));

    expect(actions.move(1, 'ArrowRight')).toBe(2);
    expect(actions.move(2, 'ArrowDown')).toBe(0);
    expect(actions.move(0, 'ArrowLeft')).toBe(2);
    expect(actions.move(1, 'Home')).toBe(0);
    expect(seen).toEqual([
      { kind: 'select-class', classId: 'magus', specId: 'third' },
      { kind: 'select-class', classId: 'magus', specId: 'catalyst' },
      { kind: 'select-class', classId: 'magus', specId: 'third' },
      { kind: 'select-class', classId: 'magus', specId: 'catalyst' },
    ]);
  });

  it('moves the focus onto a locked or the picked Legend without picking it', () => {
    const actions = legendStepActions(view());

    expect(actions.move(1, 'End')).toBe(2);
    expect(actions.move(0, 'ArrowRight')).toBe(1);
    expect(seen).toEqual([]);
  });

  it('ignores every other key', () => {
    const actions = legendStepActions(view());

    expect(actions.move(0, 'Tab')).toBeNull();
    expect(actions.move(0, 'a')).toBeNull();
    expect(legendStepActions(view({ legends: [] })).move(0, 'ArrowRight')).toBeNull();
    expect(seen).toEqual([]);
  });

  it('locks in only while canLockIn', () => {
    legendStepActions(view({ canLockIn: false })).lockIn();
    expect(seen).toEqual([]);

    legendStepActions(view()).lockIn();
    expect(seen).toEqual([{ kind: 'confirm-selection' }]);
  });

  it('goes back with exactly one clear-class-selection', () => {
    legendStepActions(view()).back();

    expect(seen).toEqual([{ kind: 'clear-class-selection' }]);
  });
});
