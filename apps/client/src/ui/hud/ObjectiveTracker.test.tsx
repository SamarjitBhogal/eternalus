import { describe, expect, it } from 'vitest';

import type { CapturePointStatus } from '../../bridge/hud.types';
import { figmaHudState } from '../../bridge/__fixtures__/hudFixtures';
import { STRINGS } from '../strings';
import { accessibleNames, renderWithStore } from '../testStore';
import { cssRule, FIGMA_MATCH_SETUP, withHudSetup } from './hudTestSupport';
import { ObjectiveTracker } from './ObjectiveTracker';
import styles from './ObjectiveTracker.module.css';
import css from './ObjectiveTracker.module.css?raw';

const letters = (html: string) =>
  [
    ...html.matchAll(
      new RegExp(`<span class="${String(styles.letter)}" aria-hidden="true">([^<]*)</span>`, 'g'),
    ),
  ].map(([, letter]) => letter);
const flags = (html: string) =>
  [...html.matchAll(/data-team="(\w+)"[\s\S]*?(?=data-team=|$)/g)].map(([block, team]) => {
    if (block.includes(String(styles.flagOurs))) return `${String(team)}:ours`;
    if (block.includes(String(styles.flagTheirs))) return `${String(team)}:theirs`;
    return `${String(team)}:none`;
  });

const darkPlayer = {
  ...withHudSetup(figmaHudState()),
  matchSetup: { ...FIGMA_MATCH_SETUP, playerTeam: 'dark' as const },
};

describe('ObjectiveTracker', () => {
  it('shows A, B, C on the shields of their absolute owners', () => {
    const html = renderWithStore(<ObjectiveTracker />, withHudSetup(figmaHudState()));
    expect(letters(html)).toEqual(['A', 'B', 'C']);
    expect(
      [...html.matchAll(/src="\/assets\/test\/(objective-shield-\w+)\.webp"/g)].map(([, id]) => id),
    ).toEqual(['objective-shield-light', 'objective-shield-neutral', 'objective-shield-dark']);
  });

  it('marks who holds each point with a flag, not colour alone, for both player teams (CD-03)', () => {
    const light = renderWithStore(<ObjectiveTracker />, withHudSetup(figmaHudState()));
    expect(flags(light)).toEqual(['light:ours', 'neutral:none', 'dark:theirs']);
    expect(light).toContain('/assets/test/allegiance-flag.webp');
    expect(light).toContain('/assets/test/allegiance-flag@mirrored.webp');
    expect(flags(renderWithStore(<ObjectiveTracker />, darkPlayer))).toEqual([
      'light:theirs',
      'neutral:none',
      'dark:ours',
    ]);
  });

  it('names each objective with its holder and its capture bar', () => {
    const html = renderWithStore(<ObjectiveTracker />, withHudSetup(figmaHudState()));
    expect(accessibleNames(html, '[role=group]')).toEqual([
      'Capture points',
      'Capture Point A, held by your team',
      'Cathedral B, not captured',
      'Capture Point C, held by the enemy',
    ]);
    expect(accessibleNames(html, '[role=meter]')).toEqual([
      'Capture progress',
      'Capture progress',
      'Capture progress',
    ]);
  });

  it('falls back to numbers past the lettered lanes (I-07)', () => {
    const lanes = STRINGS.hud.objectiveLetters.length + 1;
    const points: CapturePointStatus[] = Array.from({ length: lanes }, (_, laneIndex) => ({
      pointId: `point-${String(laneIndex)}`,
      kind: 'capture-point',
      laneIndex,
      ownerTeam: 'neutral',
      progress: null,
    }));
    const html = renderWithStore(<ObjectiveTracker />, {
      ...withHudSetup(figmaHudState()),
      match: { ...figmaHudState().match, capturePoints: points },
    });
    expect(letters(html)).toEqual(['A', 'B', 'C', 'D', 'E', '6']);
    expect(accessibleNames(html, '[role=img]')).toHaveLength(lanes);
  });

  it('rings the shields only through the minimums-set tokens (OD-11 b)', () => {
    expect(cssRule(css, ".objective[data-team='light']")).toContain(
      '--shield-outline: var(--team-light-hud-shield-outline)',
    );
    expect(cssRule(css, '.shieldRing')).toContain(
      'drop-shadow(calc(1 * var(--hud-u)) 0 0 var(--shield-outline))',
    );
    expect(cssRule(css, '.shield')).not.toMatch(/filter|transform|object-fit/);
  });
});
