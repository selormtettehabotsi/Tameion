#!/usr/bin/env node
/**
 * Image audit: proves every photo the client can render actually resolves.
 *
 * Extracts every Pexels photo id from client/src/lib/images.ts and requests it
 * at every size the app renders. That is a superset of the URLs the module
 * emits, so a green run means there are no broken images anywhere in the UI.
 *
 * Usage: node scripts/verify-images.mjs
 * Exit code 0 = all 200, 1 = at least one non-200.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, '..', 'client', 'src', 'lib', 'images.ts');

// Every (width, height) pair the components request.
const SIZES = [
  [1600, 900],   // hero
  [1200, 1600],  // auth split panel
  [400, 600],    // book cover
  [200, 300],    // book cover, compact
  [160, 160],    // avatar
  [40, 40],      // avatar, inline
  [600, 400],    // empty state
];

const CONCURRENCY = 5;
const RETRIES = 3;

/**
 * Fetch a URL, retrying transport errors with backoff.
 *
 * Without this, a dropped connection under concurrency reports as a failure
 * even though the image is fine. Only transport errors are retried — an HTTP
 * status (including 404) is returned immediately, so a genuinely broken URL
 * still fails the audit.
 */
async function check(url) {
  let lastErr;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow' });
      return res.status;
    } catch (err) {
      lastErr = err;
      if (attempt < RETRIES) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
  }
  return `ERR ${lastErr?.message ?? 'unknown'}`;
}

async function main() {
  const text = await readFile(source, 'utf8');
  const ids = [...new Set(text.match(/'(\d{6,9})'/g)?.map((m) => m.slice(1, -1)) ?? [])];

  if (ids.length === 0) {
    console.error('No photo ids found in', source);
    process.exit(1);
  }

  const urls = ids.flatMap((id) =>
    SIZES.map(([w, h]) =>
      `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg` +
      `?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`
    )
  );

  console.log(`Verifying ${urls.length} URLs (${ids.length} photos x ${SIZES.length} sizes)...`);

  const failures = [];
  let done = 0;
  const queue = [...urls];

  async function worker() {
    for (;;) {
      const url = queue.shift();
      if (!url) return;
      const status = await check(url);
      done++;
      if (status !== 200) failures.push({ url, status });
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`Checked ${done}. OK: ${done - failures.length}. Failed: ${failures.length}.`);
  if (failures.length) {
    for (const f of failures) console.error(`  ${f.status}  ${f.url}`);
    process.exit(1);
  }
  console.log('All images returned HTTP 200.');
}

main();
