/**
 * Test support (re-exported by `testStore.tsx`): accessible names read from server-rendered markup,
 * for tests that run in Node without a DOM. Never imported by a module `main.tsx` reaches.
 */

/** Elements with no end tag (the server renderer writes `<img …/>`; `<img …>` counts too). */
const VOID_ELEMENTS = new Set('area br col hr img input link meta source wbr'.split(' '));
/** Selectors whose elements take their name from their content (WAI-ARIA 1.2 "Name From: contents"). */
const NAMED_FROM_CONTENT = new Set(['button', '[role=radio]']);
const TAG = /<(\/?)([a-zA-Z][\w-]*)((?:\s+[^\s=/>]+(?:="[^"]*")?)*)\s*(\/?)>/g;
const ATTRIBUTE = /([^\s=/>]+)(?:="([^"]*)")?/g;
const SELECTOR = /^(?:([a-z][\w-]*)|\[([\w-]+)(?:=([\w-]+))?\])$/;
const ENTITY = /&(?:amp|lt|gt|quot|#x27);/g;
const ENTITIES: Readonly<Record<string, string>> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
};

/** One start or end tag of server markup, with its attributes and its span in the string. */
type Tag = {
  readonly name: string;
  readonly isClosing: boolean;
  /** A void element or a self-closed tag: it has no end tag. */
  readonly isVoid: boolean;
  readonly attributes: ReadonlyMap<string, string>;
  readonly start: number;
  readonly end: number;
};

function tagsIn(html: string): Tag[] {
  return [...html.matchAll(TAG)].map((match) => {
    const [text, slash, rawName = '', attributes = '', selfClose] = match;
    const name = rawName.toLowerCase();
    return {
      name,
      isClosing: slash === '/',
      isVoid: selfClose === '/' || VOID_ELEMENTS.has(name),
      attributes: new Map(
        [...attributes.matchAll(ATTRIBUTE)].map(([, key = '', value = '']) => [key, value]),
      ),
      start: match.index,
      end: match.index + text.length,
    };
  });
}

/** The text with entities decoded and whitespace collapsed, as a name. */
function asName(text: string): string {
  return text
    .replace(ENTITY, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, ' ')
    .trim();
}

/** The index of the end tag that closes `tags[open]`: a same-tag depth counter; itself if void. */
function closingIndex(tags: readonly Tag[], open: number): number {
  const opening = tags[open];
  if (opening === undefined || opening.isVoid) return open;
  let depth = 0;
  for (let index = open; index < tags.length; index += 1) {
    const tag = tags[index];
    if (tag?.name !== opening.name || tag.isVoid) continue;
    depth += tag.isClosing ? -1 : 1;
    if (depth === 0) return index;
  }
  throw new Error(`accessibleNames: <${opening.name}> at ${String(opening.start)} has no end tag`);
}

/** The text inside `tags[open]`, without its `aria-hidden="true"` subtrees. */
function visibleText(html: string, tags: readonly Tag[], open: number): string {
  const close = closingIndex(tags, open);
  let text = '';
  let cursor = tags[open]?.end ?? 0;
  for (let index = open + 1; index <= close; index += 1) {
    const tag = tags[index];
    if (tag === undefined) break;
    text += html.slice(cursor, tag.start);
    const isHidden = !tag.isClosing && tag.attributes.get('aria-hidden') === 'true';
    const resume = isHidden ? closingIndex(tags, index) : index;
    cursor = tags[resume]?.end ?? tag.end;
    index = resume;
  }
  return asName(text);
}

/** The text of the one element `id` names, which must be a text leaf. */
function labelText(html: string, tags: readonly Tag[], id: string): string {
  const open = tags.findIndex((tag) => !tag.isClosing && tag.attributes.get('id') === id);
  const opening = tags[open];
  const closing = tags[open + 1];
  if (/\s/.test(id) || opening === undefined || !closing?.isClosing) {
    throw new Error(`accessibleNames: aria-labelledby="${id}" must name one text-leaf element`);
  }
  return asName(html.slice(opening.end, closing.start));
}

/**
 * The accessible name of every element of server-rendered `html` matching `selector` (a tag name,
 * `[attr]` or `[attr=value]`), in document order, by the accname 1.2 order for the forms the UI
 * uses: `aria-labelledby` (one id, naming a text-leaf element) → `aria-label` → for `button` and
 * `[role=radio]` only (name from content), the element's text with every `aria-hidden="true"`
 * subtree removed and whitespace collapsed; every other selector (`[role=radiogroup]`,
 * `[role=meter]`, `[role=img]`, `[role=group]`, `[role=timer]`, `[role=dialog]`, `[tabindex]`:
 * name from author) gets `''`, so a forgotten label shows.
 *
 * Limits: the role split above is by selector, not by computed role; no CSS-hidden content
 * (`display: none`, `hidden`) is removed; nested controls are not named recursively;
 * `aria-labelledby` lists and non-leaf targets throw. End tags are found by a same-tag depth
 * counter over the markup (no parser); void elements are the fixed list above.
 */
export function accessibleNames(html: string, selector: string): string[] {
  const parts = SELECTOR.exec(selector);
  if (parts === null) throw new Error(`accessibleNames: unsupported selector ${selector}`);
  const [, tagName, attribute = '', value] = parts;
  const isMatch = (tag: Tag): boolean =>
    !tag.isClosing &&
    (tagName === undefined
      ? value === undefined
        ? tag.attributes.has(attribute)
        : tag.attributes.get(attribute) === value
      : tag.name === tagName);
  const tags = tagsIn(html);
  return tags.flatMap((tag, index) => {
    if (!isMatch(tag)) return [];
    const labelledBy = tag.attributes.get('aria-labelledby');
    if (labelledBy !== undefined) return [labelText(html, tags, labelledBy)];
    const label = tag.attributes.get('aria-label');
    if (label !== undefined) return [asName(label)];
    return [NAMED_FROM_CONTENT.has(selector) ? visibleText(html, tags, index) : ''];
  });
}
