import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { renderLandingPage } from '../src/landing/render.ts';

const ROOT = process.cwd();

function writeIfChanged(relPath, nextHtml) {
  const fullPath = resolve(ROOT, relPath);
  mkdirSync(dirname(fullPath), { recursive: true });
  try {
    const prev = readFileSync(fullPath, 'utf8');
    if (prev === nextHtml) return false;
  } catch {
    // File does not exist yet
  }
  writeFileSync(fullPath, nextHtml, 'utf8');
  return true;
}

export function generateLandingHtml() {
  const wroteEn = writeIfChanged('index.html', renderLandingPage('en'));
  const wroteAr = writeIfChanged('ar/index.html', renderLandingPage('ar'));
  return { wroteEn, wroteAr };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { wroteEn, wroteAr } = generateLandingHtml();
  console.log(`Landing HTML ready (index.html: ${wroteEn ? 'updated' : 'unchanged'}, ar/index.html: ${wroteAr ? 'updated' : 'unchanged'}).`);
}
