#!/usr/bin/env node
/**
 * Image audit: proves every photo the client can render actually exists.
 *
 * Imagery is bundled in client/public/img, so this is an offline, filesystem
 * check — no network, deterministic, and safe to run in CI.
 *
 * For each path emitted by client/src/lib/images.ts it asserts the file:
 *   - exists under client/public
 *   - is non-empty
 *   - starts with the JPEG magic bytes (FF D8 FF), so a truncated or
 *     HTML-error-page download cannot pass as an image
 *
 * It also reports any file in client/public/img that nothing references, so
 * dead weight does not accumulate in the bundle.
 *
 * Usage: node scripts/verify-images.mjs
 * Exit code 0 = all good, 1 = at least one problem.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const source = join(root, 'client', 'src', 'lib', 'images.ts');
const publicDir = join(root, 'client', 'public');
const imgDir = join(publicDir, 'img');

/**
 * Pull the referenced paths straight out of images.ts.
 *
 * The module builds every URL as `${IMG}/<file>` with IMG = '/img', plus the
 * two single-purpose constants, so matching the quoted filenames and the two
 * literal paths covers everything allImageUrls() can return.
 */
function referencedFiles(text) {
  const files = new Set();
  for (const m of text.matchAll(/'(?:\$\{IMG\}\/)?((?:hero|auth|cover-|avatar-|empty-)[a-z0-9-]*\.jpg)'/gi)) {
    files.add(m[1]);
  }
  for (const m of text.matchAll(/`\$\{IMG\}\/(\w[\w-]*\.jpg)`/g)) {
    files.add(m[1]);
  }
  return [...files];
}

async function main() {
  const text = await readFile(source, 'utf8');
  const files = referencedFiles(text);

  if (files.length === 0) {
    console.error(`No image filenames found in ${source}`);
    process.exit(1);
  }

  console.log(`Verifying ${files.length} bundled images against ${imgDir}...`);

  const problems = [];
  for (const file of files) {
    const path = join(imgDir, file);
    try {
      const info = await stat(path);
      if (!info.isFile()) {
        problems.push(`${file}: not a regular file`);
        continue;
      }
      if (info.size === 0) {
        problems.push(`${file}: empty file`);
        continue;
      }
      const head = (await readFile(path)).subarray(0, 3);
      if (!(head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff)) {
        problems.push(`${file}: not a JPEG (bad magic bytes)`);
      }
    } catch {
      problems.push(`${file}: MISSING from client/public/img`);
    }
  }

  // Anything on disk that images.ts never references.
  let orphans = [];
  try {
    const onDisk = (await readdir(imgDir)).filter((f) => f.toLowerCase().endsWith('.jpg'));
    orphans = onDisk.filter((f) => !files.includes(f));
  } catch {
    problems.push(`${imgDir} is not readable`);
  }

  console.log(`Checked ${files.length}. OK: ${files.length - problems.length}. Failed: ${problems.length}.`);

  if (orphans.length) {
    console.warn(`Unreferenced files in client/public/img: ${orphans.join(', ')}`);
  }

  if (problems.length) {
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }

  console.log('All bundled images present and valid.');
}

main();
