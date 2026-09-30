#!/usr/bin/env node
/**
 * Documentation guardrail (zero dependencies).
 *
 *   node scripts/docs/check-docs.mjs          # validate: frontmatter schema, relative links, anchors, index freshness
 *   node scripts/docs/check-docs.mjs --write  # same, but regenerate the index tables in docs/README.md
 *
 * Rules (ADR 0008, docs/requirements/03-organization-guidelines.md):
 * - Every Markdown file under docs/ has YAML frontmatter with exactly the allowed keys, a `title`
 *   equal to the first H1, a one-sentence `description`, `audience` ⊆ {humans, agents},
 *   `status` ∈ {draft, active, deprecated}, an ISO `last-reviewed` date and lowercase-hyphen tags.
 * - Every relative Markdown link resolves to an existing file (and heading anchor, when given).
 * - docs/README.md contains generated index tables between marker comments; they must be current.
 *
 * Exit code 1 on any error (CI and `npm run check` fail); the report names every offending file.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const INDEX_FILE = path.join(DOCS_DIR, 'README.md');
const WRITE = process.argv.includes('--write');

const ALLOWED_KEYS = new Set([
  'title',
  'description',
  'audience',
  'status',
  'owner',
  'last-reviewed',
  'tags',
  'paths',
  'related',
]);
const REQUIRED_KEYS = [
  'title',
  'description',
  'audience',
  'status',
  'owner',
  'last-reviewed',
  'tags',
];
const AUDIENCES = new Set(['humans', 'agents']);
const STATUSES = new Set(['draft', 'active', 'deprecated']);
/** Files that are indexes themselves or verbatim sources and may skip frontmatter. */
const FRONTMATTER_EXEMPT = new Set(['docs/README.md']);
/** Folders whose files appear in the generated index, in display order. */
const INDEX_SECTIONS = [
  ['plan', 'Plan'],
  ['architecture', 'Architecture'],
  ['requirements', 'Requirements'],
  ['reference', 'Reference'],
  ['research', 'Research'],
  ['process', 'Process'],
  ['agents', 'Agents'],
  ['decisions', 'Decisions (ADRs)'],
  ['reviews', 'Reviews and retrospectives'],
  ['changelog', 'Changelog'],
];

const errors = [];
const warnings = [];

/** Recursively lists Markdown files under a directory, sorted for deterministic output. */
function listMarkdown(dir) {
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...listMarkdown(full));
    } else if (entry.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Minimal YAML frontmatter parser for the flat schema we use: scalars, flow lists (`[a, b]`),
 * multi-line flow lists, and quoted strings. Anything else is reported as an error.
 */
function parseFrontmatter(text, file) {
  if (!text.startsWith('---\n')) {
    return null;
  }
  const end = text.indexOf('\n---', 4);
  if (end === -1) {
    errors.push(`${file}: frontmatter is not closed with ---`);
    return null;
  }
  const block = text.slice(4, end);
  const body = text.slice(end + 4);
  const data = {};
  const lines = block.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() === '') {
      continue;
    }
    const match = /^([a-z][a-z-]*):\s*(.*)$/.exec(line);
    if (match === null) {
      errors.push(`${file}: cannot parse frontmatter line ${i + 1}: "${line}"`);
      continue;
    }
    const key = match[1];
    let value = match[2].trim();
    if (value === '' && i + 1 < lines.length) {
      // Block sequence (`- item` lines) or a flow list that starts on the next line.
      const next = lines[i + 1].trim();
      if (next.startsWith('- ')) {
        const items = [];
        while (i + 1 < lines.length && lines[i + 1].trim().startsWith('- ')) {
          i += 1;
          items.push(stripQuotes(lines[i].trim().slice(2).trim()));
        }
        data[key] = items;
        continue;
      }
      if (next.startsWith('[')) {
        i += 1;
        value = next;
      }
    }
    if (value.startsWith('[') && !value.endsWith(']')) {
      // multi-line flow list: gather until the closing bracket
      while (i + 1 < lines.length && !value.endsWith(']')) {
        i += 1;
        value += ` ${lines[i].trim()}`;
      }
    }
    data[key] = parseValue(value);
  }
  return { data, body };
}

function parseValue(raw) {
  if (raw.startsWith('[') && raw.endsWith(']')) {
    const inner = raw.slice(1, -1).trim();
    if (inner === '') {
      return [];
    }
    return inner
      .split(',')
      .map((item) => stripQuotes(item.trim()))
      .filter((item) => item !== '');
  }
  return stripQuotes(raw);
}

function stripQuotes(value) {
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function firstHeading(body) {
  const match = /^#\s+(.+)$/m.exec(body);
  return match === null ? null : match[1].trim();
}

/**
 * GitHub-style heading slug: lowercase, drop everything that is not a letter, number, space or
 * hyphen, then turn every single space into a hyphen (GitHub does not collapse runs of spaces,
 * so "Sprint 1.3 — Map" becomes "sprint-13--map").
 */
function slugify(heading) {
  return heading
    .toLowerCase()
    .replace(/[`*_~[\]()]/g, '')
    .replace(/[^\p{L}\p{N} -]/gu, '')
    .trim()
    .replace(/ /g, '-');
}

function headingSlugs(body) {
  const slugs = new Map();
  for (const match of body.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)) {
    const base = slugify(match[1]);
    const count = slugs.get(base) ?? 0;
    slugs.set(base, count + 1);
    if (count > 0) {
      slugs.set(`${base}-${count}`, 1);
    }
  }
  return slugs;
}

function stripCodeBlocks(text) {
  return text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
}

function validateFrontmatter(file, relative, parsed) {
  if (parsed === null) {
    if (!FRONTMATTER_EXEMPT.has(relative)) {
      errors.push(`${relative}: missing frontmatter`);
    }
    return;
  }
  const { data, body } = parsed;
  for (const key of Object.keys(data)) {
    if (!ALLOWED_KEYS.has(key)) {
      errors.push(`${relative}: unknown frontmatter key "${key}"`);
    }
  }
  for (const key of REQUIRED_KEYS) {
    if (!(key in data)) {
      errors.push(`${relative}: missing frontmatter key "${key}"`);
    }
  }
  const heading = firstHeading(body);
  if (typeof data.title === 'string' && heading !== null && data.title !== heading) {
    errors.push(`${relative}: title "${data.title}" does not match H1 "${heading}"`);
  }
  if (typeof data.description === 'string' && data.description.length < 20) {
    errors.push(`${relative}: description is too short to be useful`);
  }
  if (Array.isArray(data.audience)) {
    for (const audience of data.audience) {
      if (!AUDIENCES.has(audience)) {
        errors.push(`${relative}: audience "${audience}" is not one of humans, agents`);
      }
    }
  } else if ('audience' in data) {
    errors.push(`${relative}: audience must be a list`);
  }
  if ('status' in data && !STATUSES.has(data.status)) {
    errors.push(`${relative}: status "${data.status}" is not one of draft, active, deprecated`);
  }
  if ('last-reviewed' in data && !/^\d{4}-\d{2}-\d{2}$/.test(String(data['last-reviewed']))) {
    errors.push(`${relative}: last-reviewed must be an ISO date (YYYY-MM-DD)`);
  }
  if (Array.isArray(data.tags)) {
    for (const tag of data.tags) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(tag)) {
        errors.push(`${relative}: tag "${tag}" must be lowercase-hyphen`);
      }
    }
  } else if ('tags' in data) {
    errors.push(`${relative}: tags must be a list`);
  }
  if (Array.isArray(data.related)) {
    for (const target of data.related) {
      if (!existsSync(path.join(ROOT, target))) {
        errors.push(`${relative}: related "${target}" does not exist (paths are repo-relative)`);
      }
    }
  }
}

function validateLinks(file, relative, text, slugCache) {
  const source = stripCodeBlocks(text);
  for (const match of source.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1];
    if (/^(https?:|mailto:|#)/.test(target)) {
      if (target.startsWith('#')) {
        const slugs = slugCache.get(file);
        if (slugs !== undefined && !slugs.has(target.slice(1))) {
          errors.push(`${relative}: anchor "${target}" not found in this file`);
        }
      }
      continue;
    }
    const [targetPath, anchor] = target.split('#');
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(targetPath));
    if (!existsSync(resolved)) {
      errors.push(`${relative}: broken link "${target}"`);
      continue;
    }
    if (anchor !== undefined && resolved.endsWith('.md')) {
      let slugs = slugCache.get(resolved);
      if (slugs === undefined) {
        slugs = headingSlugs(readFileSync(resolved, 'utf8'));
        slugCache.set(resolved, slugs);
      }
      if (!slugs.has(anchor)) {
        errors.push(
          `${relative}: anchor "#${anchor}" not found in ${path.relative(ROOT, resolved)}`,
        );
      }
    }
  }
}

function buildIndex(entries) {
  const lines = [];
  for (const [folder, label] of INDEX_SECTIONS) {
    const rows = entries.filter((entry) => entry.relative.startsWith(`docs/${folder}/`));
    if (rows.length === 0) {
      continue;
    }
    lines.push(`### ${label}`, '', '| Document | Description | Status |', '| --- | --- | --- |');
    for (const row of rows) {
      const link = row.relative.slice('docs/'.length);
      lines.push(
        `| [${escapePipes(row.title)}](${link}) | ${escapePipes(row.description)} | ${row.status} |`,
      );
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

function escapePipes(text) {
  return String(text).replace(/\|/g, '\\|');
}

function checkIndex(entries) {
  if (!existsSync(INDEX_FILE)) {
    errors.push('docs/README.md is missing');
    return;
  }
  const text = readFileSync(INDEX_FILE, 'utf8');
  const start = '<!-- docs-index:start -->';
  const end = '<!-- docs-index:end -->';
  const startAt = text.indexOf(start);
  const endAt = text.indexOf(end);
  if (startAt === -1 || endAt === -1 || endAt < startAt) {
    errors.push(
      'docs/README.md must contain <!-- docs-index:start --> and <!-- docs-index:end --> markers',
    );
    return;
  }
  const generated = `${start}\n\n${buildIndex(entries)}\n\n${end}`;
  const current = text.slice(startAt, endAt + end.length);
  // Prettier re-aligns table columns after generation, so compare a whitespace-normalised form.
  if (normaliseTable(current) !== normaliseTable(generated)) {
    if (WRITE) {
      writeFileSync(
        INDEX_FILE,
        `${text.slice(0, startAt)}${generated}${text.slice(endAt + end.length)}`,
      );
      formatWithPrettier(INDEX_FILE);
      process.stdout.write('docs/README.md index regenerated.\n');
    } else {
      errors.push('docs/README.md index is stale: run `npm run docs:index`');
    }
  }
}

/** Collapses the padding Prettier adds inside table cells and separator rows. */
function normaliseTable(block) {
  return block
    .split('\n')
    .map((line) =>
      line
        .replace(/-{3,}/g, '---')
        .replace(/\s*\|\s*/g, '|')
        .trimEnd(),
    )
    .join('\n');
}

/** Runs the repo's Prettier on a file so generated tables match `npm run format:check`. */
function formatWithPrettier(file) {
  const result = spawnSync(
    'npx',
    ['--no-install', 'prettier', '--write', '--log-level', 'warn', file],
    { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32' },
  );
  if (result.status !== 0) {
    warnings.push(`prettier could not format ${path.relative(ROOT, file)}: ${result.stderr}`);
  }
}

function main() {
  if (!existsSync(DOCS_DIR)) {
    errors.push('docs/ folder not found');
    return;
  }
  const files = listMarkdown(DOCS_DIR);
  const entries = [];
  const slugCache = new Map();
  for (const file of files) {
    const relative = path.relative(ROOT, file).split(path.sep).join('/');
    const text = readFileSync(file, 'utf8');
    const parsed = parseFrontmatter(text, relative);
    validateFrontmatter(file, relative, parsed);
    slugCache.set(file, headingSlugs(parsed === null ? text : parsed.body));
    if (parsed !== null && typeof parsed.data.title === 'string') {
      entries.push({
        relative,
        title: parsed.data.title,
        description: typeof parsed.data.description === 'string' ? parsed.data.description : '',
        status: typeof parsed.data.status === 'string' ? parsed.data.status : '',
      });
    }
  }
  for (const file of files) {
    const relative = path.relative(ROOT, file).split(path.sep).join('/');
    validateLinks(file, relative, readFileSync(file, 'utf8'), slugCache);
  }
  checkIndex(entries);
  process.stdout.write(`Checked ${files.length} Markdown files under docs/.\n`);
}

main();

for (const warning of warnings) {
  process.stdout.write(`warning: ${warning}\n`);
}
if (errors.length > 0) {
  process.stderr.write(`${errors.map((error) => `error: ${error}`).join('\n')}\n`);
  process.stderr.write(
    `\n${errors.length} documentation error(s). See scripts/docs/check-docs.mjs for the rules.\n`,
  );
  process.exit(1);
}
process.stdout.write('Documentation check passed.\n');
