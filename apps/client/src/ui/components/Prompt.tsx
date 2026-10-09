import type { ReactElement } from 'react';

import type { InputAction } from '../../bridge/Binding.types';
import { KeyGlyph } from './KeyGlyph';

// `{action:<id>}`; split() keeps the captured id at every odd index.
const PLACEHOLDER = /\{action:([a-z0-9-]+)\}/;

/**
 * A line of text with `{action:<id>}` placeholders, each rendered as the action's current
 * `KeyGlyph`: `<Prompt template="Press {action:turret-toggle-control} to take control" />`.
 * No prompt names a key, so every prompt follows the player's bindings.
 */
export function Prompt({ template }: { readonly template: string }): ReactElement {
  const parts = template.split(PLACEHOLDER);
  return (
    <span>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          // The template author names the action; an unknown id renders as unbound.
          <KeyGlyph key={index} action={part as InputAction} />
        ) : (
          part
        ),
      )}
    </span>
  );
}
