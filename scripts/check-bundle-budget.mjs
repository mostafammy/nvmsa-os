import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const ASSETS_DIR = join(process.cwd(), 'dist', 'client', 'assets');
const ENTRY_WARN_BYTES = 108 * 1024;
const ENTRY_FAIL_BYTES = 115 * 1024;
const ASYNC_WARN_BYTES = 32 * 1024;
const ASYNC_FAIL_BYTES = 40 * 1024;
const CSS_FAIL_BYTES = 12 * 1024;

let failed = false;

for (const file of readdirSync(ASSETS_DIR)) {
  const fullPath = join(ASSETS_DIR, file);
  if (!file.endsWith('.js') && !file.endsWith('.css')) continue;

  const gzipped = gzipSync(readFileSync(fullPath)).byteLength;
  const kb = (gzipped / 1024).toFixed(2);

  if (file.endsWith('.css')) {
    console.log(`CSS   ${file}: ${kb} kB gzip`);
    if (gzipped > CSS_FAIL_BYTES) {
      console.error(`FAIL: ${file} exceeds 12 kB gzipped CSS budget`);
      failed = true;
    }
    continue;
  }

  if (file.startsWith('index-')) {
    console.log(`ENTRY ${file}: ${kb} kB gzip`);
    if (gzipped > ENTRY_FAIL_BYTES) {
      console.error(`FAIL: Entry bundle ${file} exceeds 115 kB gzipped hard limit`);
      failed = true;
    } else if (gzipped > ENTRY_WARN_BYTES) {
      console.warn(`WARN: Entry bundle ${file} exceeds 108 kB target budget`);
    }
  } else {
    console.log(`CHUNK ${file}: ${kb} kB gzip`);
    if (gzipped > ASYNC_FAIL_BYTES) {
      console.error(`FAIL: Async chunk ${file} exceeds 40 kB gzipped hard limit`);
      failed = true;
    } else if (gzipped > ASYNC_WARN_BYTES) {
      console.warn(`WARN: Async chunk ${file} exceeds 32 kB target budget`);
    }
  }
}

if (failed) {
  process.exit(1);
}
console.log('Bundle budget check passed.');
