import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { LoadoutRadioGroup } from './LoadoutRadioGroup';

const CHOICES = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Bravo' },
  { id: 'c', label: 'Charlie' },
];

const render = (pickedId: string | null, autoFocusPicked = false): string =>
  renderToStaticMarkup(
    <LoadoutRadioGroup
      label="Pick one"
      choices={CHOICES}
      pickedId={pickedId}
      onPick={() => undefined}
      autoFocusPicked={autoFocusPicked}
    />,
  );

const radios = (html: string): string[] => html.match(/<button[^>]*role="radio"[^>]*>/g) ?? [];

describe('LoadoutRadioGroup', () => {
  it('is a labelled radio group with one radio per choice, in order', () => {
    const html = render('b');
    expect(html).toContain('role="radiogroup" aria-label="Pick one"');
    expect(radios(html)).toHaveLength(3);
    expect(html.indexOf('Alpha')).toBeLessThan(html.indexOf('Charlie'));
  });

  it('checks the picked choice and gives it the one tab stop', () => {
    const tags = radios(render('b'));
    expect(tags.map((tag) => tag.includes('aria-checked="true"'))).toEqual([false, true, false]);
    expect(tags.map((tag) => tag.includes('tabindex="0"'))).toEqual([false, true, false]);
  });

  it('puts the tab stop on the first choice when nothing is picked', () => {
    const tags = radios(render(null));
    expect(tags.map((tag) => tag.includes('tabindex="0"'))).toEqual([true, false, false]);
    expect(tags.some((tag) => tag.includes('aria-checked="true"'))).toBe(false);
  });

  it('autofocuses the picked choice only when asked', () => {
    expect(radios(render('c', true))[2]).toContain('autofocus');
    expect(render('c')).not.toContain('autofocus');
  });
});
