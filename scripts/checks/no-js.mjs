#!/usr/bin/env node
/**
 * Fails when a JavaScript file is tracked or staged. The codebase is TypeScript only; the
 * allowlist holds the tooling that must stay plain JS (ESLint config, zero-dependency Node scripts).
 */
import { execFileSync } from 'node:child_process';

const JS_FILE = /\.(c|m)?jsx?$/;
const ALLOWED = [/^eslint\.config\.js$/, /^scripts\/.*\.mjs$/];

const offenders = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter((file) => JS_FILE.test(file) && !ALLOWED.some((pattern) => pattern.test(file)));

if (offenders.length > 0) {
  console.error('[no-js] JavaScript files are not allowed; write TypeScript instead:');
  for (const file of offenders) console.error(`  ${file}`);
  process.exit(1);
}
