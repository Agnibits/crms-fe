#!/usr/bin/env node
'use strict';

/* eslint-disable no-console */
/**
 * Find hooks that are CALLED as bare identifiers but never imported or defined
 * in the same file.
 *
 * `next build` compiles this class of mistake without complaint — a missing
 * import only becomes "useX is not defined" when a real user opens the page.
 * That is how useDepartmentOptions reached production on Settings → Email.
 *
 *   npm run check
 *
 * Only bare calls count. `ticketHooks.useList(...)` is a property access and is
 * resolved at runtime, so it is deliberately ignored — flagging those buries
 * the real finding in ~110 false positives.
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'src';
const CALL = /(^|[^.\w$])(use[A-Z]\w*)\s*\(/gm;

function sourceFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!/node_modules|\.next/.test(p)) sourceFiles(p, out);
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      out.push(p);
    }
  }
  return out;
}

/**
 * Blank out comments so a hook named in a doc block isn't mistaken for a call.
 * Newlines are preserved so reported line numbers still match the real file.
 */
function stripComments(src) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  return src.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/^([ \t]*)\/\/.*$/gm, blank);
}

function namesInScope(src) {
  const known = new Set();
  for (const m of src.matchAll(/import\s+[\s\S]*?from\s+["'][^"']+["']/g)) {
    for (const n of m[0].matchAll(/\b(use[A-Z]\w*)\b/g)) known.add(n[1]);
  }
  for (const m of src.matchAll(/(?:function|const|let|var)\s+(use[A-Z]\w*)/g)) known.add(m[1]);
  // Destructured from an object: const { useList, useDetail } = crudHooks(...)
  for (const m of src.matchAll(/[{,]\s*(use[A-Z]\w*)\s*[,}:=]/g)) known.add(m[1]);
  return known;
}

let failures = 0;
for (const file of sourceFiles(ROOT)) {
  const code = stripComments(fs.readFileSync(file, 'utf8'));
  const called = new Set([...code.matchAll(CALL)].map((m) => m[2]));
  if (!called.size) continue;

  const known = namesInScope(code);
  for (const name of called) {
    if (known.has(name)) continue;
    const at = code.search(new RegExp('(^|[^.\\w$])' + name + '\\s*\\('));
    const line = code.slice(0, at).split('\n').length;
    console.error(`${file}:${line}  ${name} is called but never imported`);
    failures += 1;
  }
}

if (failures) {
  console.error(`\n✗ ${failures} undefined hook call(s)`);
  process.exit(1);
}
console.log('✓ no undefined hook calls');
