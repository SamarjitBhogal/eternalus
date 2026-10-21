import { describe, expect, it } from 'vitest';

import { settingsSlice } from '../../bridge/slices/settingsSlice';
import { renderWithStore } from '../testStore';
import { Prompt } from './Prompt';

function render(template: string): string {
  return renderWithStore(<Prompt template={template} />, {
    settings: {
      ...settingsSlice.getInitialState(),
      bindings: [
        {
          action: 'turret-toggle-control',
          chords: [{ device: 'keyboard', code: 'KeyP', label: 'P' }],
        },
        { action: 'gadget-1', chords: [{ device: 'mouse', code: '3', label: 'Mouse 4' }] },
      ],
    },
  });
}

describe('Prompt', () => {
  it('renders each placeholder as the current binding', () => {
    const html = render('Press {action:turret-toggle-control} to take control');

    expect(html).toMatch(/^<span>Press <kbd[^>]*>P<\/kbd> to take control<\/span>$/);
  });

  it('renders several placeholders and leaves none unrendered', () => {
    const html = render('{action:gadget-1} or {action:turret-toggle-control}');

    expect(html).toContain('>Mouse 4<');
    expect(html).toContain('>P<');
    expect(html).not.toContain('{action:');
  });

  it('renders plain text unchanged', () => {
    expect(render('No keys here')).toBe('<span>No keys here</span>');
  });
});
