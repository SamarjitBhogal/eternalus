import { describe, expect, it } from 'vitest';

import { assetsSlice } from '../../bridge/slices/assetsSlice';
import type { LegendClassCard } from '../../bridge/catalogue.types';
import type { RootState } from '../../bridge/store';
import { accessibleNames, assetsWithBoxes, renderWithStore, TEST_CONTENT } from '../testStore';
import { ClassSelectCard } from './ClassSelectCard';
import cardCss from './ClassSelectCard.module.css?raw';
import { classSlot } from './classSelectLayout';

const cardOf = (classId: string): LegendClassCard => {
  const card = TEST_CONTENT.legendClasses.find((candidate) => candidate.classId === classId);
  if (card === undefined) throw new Error(`no ${classId} in TEST_CONTENT`);
  return card;
};

const INDEX: Readonly<Record<string, number>> = { warrior: 0, sentinel: 1, magus: 2, flying: 3 };

function render(
  classId: string,
  {
    isPicked = false,
    isPreviewed = false,
    isTabbable = false,
    isAutoFocused = false,
    allyCount = 2,
    card = cardOf(classId),
    isLoaded = true,
    assets,
  }: {
    readonly isPicked?: boolean;
    readonly isPreviewed?: boolean;
    readonly isTabbable?: boolean;
    readonly isAutoFocused?: boolean;
    readonly allyCount?: number;
    readonly card?: LegendClassCard;
    readonly isLoaded?: boolean;
    readonly assets?: RootState['assets'];
  } = {},
): string {
  const noop = (): void => undefined;
  return renderWithStore(
    <ClassSelectCard
      card={card}
      slot={classSlot(4, INDEX[classId] ?? 0)}
      allyCount={allyCount}
      isPicked={isPicked}
      isPreviewed={isPreviewed}
      isTabbable={isTabbable}
      isAutoFocused={isAutoFocused}
      describedBy="panel"
      onPick={noop}
      onPreview={noop}
      onKeyDown={noop}
    />,
    assets !== undefined ? { assets } : isLoaded ? {} : { assets: assetsSlice.getInitialState() },
  );
}

/** The `<button role="radio">` start tag. */
const rootTag = (html: string): string => /<button[^>]*>/.exec(html)?.[0] ?? '';

describe('ClassSelectCard', () => {
  it('is a radio named by its class, role and ally count, described by the panel', () => {
    const html = render('warrior', { isTabbable: true });

    expect(accessibleNames(html, '[role=radio]')).toEqual(['Legionnaire Assault 2 Allies']);
    expect(rootTag(html)).toContain('type="button"');
    expect(rootTag(html)).toContain('aria-checked="false"');
    expect(rootTag(html)).toContain('aria-describedby="panel"');
    expect(rootTag(html)).toContain('tabindex="0"');
    expect(rootTag(html)).toContain('data-class-id="warrior"');
    expect(rootTag(html)).toContain('--card-accent:var(--class-warrior-accent)');
    expect(rootTag(html)).not.toContain('autofocus');
  });

  it('counts one ally in the singular', () => {
    expect(accessibleNames(render('sentinel', { allyCount: 1 }), '[role=radio]')).toEqual([
      'Sentinel Tank 1 Ally',
    ]);
  });

  it('draws the picked look enlarged at its Figma box, checked, and takes the focus on Back', () => {
    const tag = rootTag(render('magus', { isPicked: true, isAutoFocused: true }));

    expect(tag).toContain('aria-checked="true"');
    expect(tag).toContain('data-look="picked"');
    expect(tag).toContain('left:1106px;top:238px');
    expect(tag).toContain('--card-fx:0.015px');
    expect(tag).toContain('autofocus=""');
  });

  it('draws a Figma look from its plate with both 1 px strokes live (OD-1, CD-16)', () => {
    const html = render('magus', { isPicked: true });

    expect(rootTag(html)).toContain('data-art-mode="plate"');
    expect(rootTag(html)).toContain(
      '--art-left:5px;--art-top:5px;--art-width:277px;--art-height:592px',
    );
    expect(html).toContain('src="/assets/test/magus-card-plate-picked.webp"');
    expect(html).toContain('data-arch-part="art-stroke"');
    expect(html).toContain('data-arch-part="overlay-stroke"');
    expect(html).not.toContain('magus-card-art');
  });

  it('draws the live art where the look has no plate (Magus idle, Legionnaire picked)', () => {
    for (const html of [render('magus'), render('warrior', { isPicked: true })]) {
      expect(rootTag(html)).toContain('data-art-mode="cover"');
      expect(rootTag(html)).not.toContain('--art-left');
      expect(html).not.toContain('card-plate');
    }
    expect(render('magus')).toContain('src="/assets/test/magus-card-art.webp"');
  });

  // OD-1 without a plate (the visual audit of 62:125): drawn at the art's origin, the overlay's
  // 1 px stroke left a light line missing along three arches (Harbinger art 1 px left of Figma's).
  it("draws the overlay's 1 px stroke at its own node in cover mode, off the art's stroke", () => {
    const coverTransform = (look: string): string =>
      new RegExp(
        `\\.card\\[data-look='${look}'\\]\\[data-art-mode='cover'\\] \\[data-arch-layer='inner-outline'\\] \\{([^}]*)\\}`,
      ).exec(cardCss)?.[1] ?? 'missing';

    expect(rootTag(render('flying', { isLoaded: false }))).toContain(
      '--overlay-dx:1.077px;--overlay-dy:0.047px',
    );
    expect(rootTag(render('warrior', { isLoaded: false }))).toContain(
      '--overlay-dx:0.859px;--overlay-dy:0.047px',
    );
    expect(rootTag(render('magus'))).toContain('--overlay-dx:0px;--overlay-dy:0px');
    expect(rootTag(render('magus', { isPicked: true }))).not.toContain('--overlay-dx');
    expect(coverTransform('idle')).toContain(
      'transform: translate(calc(0.18px + var(--overlay-dx)), calc(0.008px + var(--overlay-dy)))',
    );
    expect(coverTransform('picked')).toContain(
      'transform: translate(calc(0.225px + var(--overlay-dx)), calc(0.644px + var(--overlay-dy)))',
    );
  });

  it('draws the live art while the plate is not loaded, or when it was cut for another slot', () => {
    const elsewhere: LegendClassCard = {
      ...cardOf('sentinel'),
      art: { ...cardOf('sentinel').art, cardPlates: { idle: 'warrior-card-plate-idle' } },
    };

    expect(rootTag(render('warrior', { isLoaded: false }))).toContain('data-art-mode="cover"');
    expect(rootTag(render('sentinel', { card: elsewhere }))).toContain('data-art-mode="cover"');
  });

  it('places its plate at the box the store gives it, and draws live art where it gives none', () => {
    const moved = render('magus', {
      isPicked: true,
      assets: assetsWithBoxes({
        'magus-card-plate-picked': { left: 1112, top: 244, width: 270, height: 580 },
      }),
    });
    const unboxed = render('magus', {
      isPicked: true,
      assets: assetsWithBoxes({ 'magus-card-plate-picked': undefined }),
    });

    expect(rootTag(moved)).toContain(
      '--art-left:6px;--art-top:6px;--art-width:270px;--art-height:580px',
    );
    expect(rootTag(unboxed)).toContain('data-art-mode="cover"');
    expect(unboxed).not.toContain('card-plate');
  });

  it('marks the previewed card for the hover cue', () => {
    expect(rootTag(render('sentinel', { isPreviewed: true }))).toContain('data-previewed="true"');
    expect(rootTag(render('sentinel'))).not.toContain('data-previewed');
  });

  it('shows a locked class with a lock and "Locked" instead of its ally count (CD-05)', () => {
    const html = render('flying');

    expect(rootTag(html)).toContain('aria-disabled="true"');
    expect(rootTag(html)).toContain('tabindex="-1"');
    expect(accessibleNames(html, '[role=radio]')).toEqual(['Harbinger aerial Locked']);
    expect(html).toContain('<svg');
    expect(html).not.toContain('Allies');
  });

  it('carries no colour literal in its markup', () => {
    expect(render('magus', { isPicked: true })).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(/);
  });
});
