#!/usr/bin/env node
/**
 * UI audit + click-through for the NVMSA OS client (headless Chrome over CDP, no deps).
 *
 *   node scripts/ui-audit.mjs --url http://localhost:5173 --out .taste-skill/before
 *
 * Writes <out>/audit.json (measurements at 390 and 1440) and <out>/clickthrough.json
 * (every link, menu, sheet and route that the unauthenticated UI exposes), plus screenshots
 * of the opened states (<out>/state-*.png).
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, v, i, a) => (v.startsWith('--') ? [...acc, [v.slice(2), a[i + 1]]] : acc), []),
);
const BASE = (args.url || 'http://localhost:5173').replace(/\/$/, '');
const OUT = path.resolve(args.out || '.taste-skill/audit');
mkdirSync(OUT, { recursive: true });

const CHROMES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
];
const chromePath = CHROMES.find((p) => existsSync(p));
if (!chromePath) throw new Error('Chrome not found');

const profile = mkdtempSync(path.join(tmpdir(), 'nvmsa-audit-'));
const chrome = spawn(chromePath, [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run',
  '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', '--force-color-profile=srgb', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

const wsUrl = await new Promise((resolve, reject) => {
  let buf = '';
  chrome.stderr.on('data', (d) => {
    buf += d;
    const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) resolve(m[1]);
  });
  setTimeout(() => reject(new Error('Chrome did not start')), 15000);
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = new WebSocket(wsUrl);
await new Promise((r) => browser.addEventListener('open', r, { once: true }));
let msgId = 0;
const pending = new Map();
const listeners = [];
browser.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  } else if (msg.method) listeners.forEach((fn) => fn(msg));
});
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    browser.send(JSON.stringify({ id, method, params, sessionId }));
  });

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);
await S('Page.enable');
await S('Runtime.enable');
const consoleErrors = [];
listeners.push((msg) => {
  if (msg.sessionId !== sessionId) return;
  if (msg.method === 'Runtime.exceptionThrown') consoleErrors.push(msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text);
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error')
    consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
});

const evaluate = async (expression) => {
  const r = await S('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};

async function setViewport(width, height, mobile) {
  await S('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await S('Emulation.setTouchEmulationEnabled', { enabled: mobile });
}

async function go(route) {
  await S('Page.navigate', { url: BASE + route });
  for (let i = 0; i < 60; i++) {
    await sleep(250);
    const ready = await evaluate(`document.readyState === 'complete' && !!document.querySelector('[data-iso-date], main')`).catch(() => false);
    if (ready) break;
  }
  await sleep(1500);
}

async function shot(name) {
  const { data } = await S('Page.captureScreenshot', { format: 'png' });
  writeFileSync(path.join(OUT, `state-${name}.png`), Buffer.from(data, 'base64'));
}

const MEASURE = `(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05; };
  const textEls = [...document.querySelectorAll('body *')].filter((el) => vis(el) &&
    [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0));
  const fams = new Set(), sizes = new Set(), weights = new Set(), colors = new Set();
  let under12 = 0;
  const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true });
  const cache = new Map();
  // Any CSS colour (oklch, rgb, hex) -> [r,g,b,a] through the canvas, so Tailwind v4 oklch reads right.
  const parse = (c) => { if (cache.has(c)) return cache.get(c); cx.clearRect(0,0,1,1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0,0,1,1);
    const d = cx.getImageData(0,0,1,1).data; const v = [d[0], d[1], d[2], d[3] / 255]; cache.set(c, v); return v; };
  const lum = ([r,g,b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v/12.92 : ((v+0.055)/1.055) ** 2.4; }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor);
      if ((c[3] ?? 1) > 0.9) return c; } return [255,255,255,1]; };
  const lowContrast = [];
  for (const el of textEls) {
    const s = getComputedStyle(el);
    fams.add(s.fontFamily.split(',')[0].replace(/["']/g,'').trim());
    sizes.add(s.fontSize); weights.add(s.fontWeight); colors.add(s.color);
    const px = parseFloat(s.fontSize); if (px < 12) under12++;
    const fg = parse(s.color), bg = bgOf(el);
    const L1 = lum(fg), L2 = lum(bg); const ratio = (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
    const large = px >= 24 || (px >= 18.66 && +s.fontWeight >= 700);
    if ((fg[3] ?? 1) > 0.9 && ratio < (large ? 3 : 4.5)) lowContrast.push({ text: el.textContent.trim().slice(0,40), ratio: +ratio.toFixed(2) });
  }
  const targets = [...document.querySelectorAll('button, a[href], select, input, textarea, [role=button]')].filter(vis);
  const small = targets.filter((el) => { const r = el.getBoundingClientRect(); return r.height < 44 || r.width < 44; })
    .map((el) => { const r = el.getBoundingClientRect(); return (el.getAttribute('aria-label') || el.textContent.trim() || el.tagName).slice(0,30) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height); });
  const radii = new Set([...document.querySelectorAll('body *')].filter(vis).map((el) => getComputedStyle(el).borderTopLeftRadius).filter((r) => r !== '0px'));
  const shadows = new Set([...document.querySelectorAll('body *')].filter(vis).map((el) => getComputedStyle(el).boxShadow).filter((s) => s !== 'none'));
  const animated = [...document.querySelectorAll('body *')].filter((el) => { const s = getComputedStyle(el);
    return (s.transitionDuration && s.transitionDuration !== '0s') || (s.animationName && s.animationName !== 'none'); }).length;
  const firstCell = document.querySelector('[data-iso-date]');
  const cellRect = firstCell ? firstCell.getBoundingClientRect() : null;
  const h1 = document.querySelector('h1'); const h2 = document.querySelector('h2');
  return {
    viewport: innerWidth + 'x' + innerHeight,
    domNodes: document.querySelectorAll('*').length,
    fontFamilies: [...fams], fontSizeCount: sizes.size, fontSizes: [...sizes].sort((a,b)=>parseFloat(a)-parseFloat(b)),
    fontWeights: [...weights].sort(), textColorCount: colors.size,
    textUnder12px: under12, textElements: textEls.length,
    lowContrast: lowContrast.length, lowContrastSamples: lowContrast.slice(0,8),
    tapTargets: targets.length, tapTargetsUnder44: small.length, tapTargetsUnder44Samples: small.slice(0,12),
    radiusValues: radii.size, shadowValues: shadows.size, elementsWithMotion: animated,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    pageHeight: document.documentElement.scrollHeight,
    dayCellSize: cellRect ? Math.round(cellRect.width) + 'x' + Math.round(cellRect.height) : null,
    h1: h1 ? { text: h1.textContent.trim(), size: getComputedStyle(h1).fontSize, family: getComputedStyle(h1).fontFamily.split(',')[0] } : null,
    monthHeading: h2 ? { text: h2.textContent.trim(), size: getComputedStyle(h2).fontSize, family: getComputedStyle(h2).fontFamily.split(',')[0] } : null,
    bodyBg: getComputedStyle(document.body).backgroundColor,
  };
})()`;

// Real pointer click at the centre of the first element matching a JS finder; checks nothing covers it.
async function clickBy(finderJs, label) {
  const info = await evaluate(`(() => { const el = (${finderJs})(); if (!el) return null;
    el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect();
    const x = r.left + r.width/2, y = r.top + r.height/2; const top = document.elementFromPoint(x, y);
    return { x, y, covered: !(top && (top === el || el.contains(top))) }; })()`);
  if (!info) return { ok: false, why: `${label}: element not found` };
  await S('Input.dispatchMouseEvent', { type: 'mouseMoved', x: info.x, y: info.y });
  await S('Input.dispatchMouseEvent', { type: 'mousePressed', x: info.x, y: info.y, button: 'left', clickCount: 1 });
  await S('Input.dispatchMouseEvent', { type: 'mouseReleased', x: info.x, y: info.y, button: 'left', clickCount: 1 });
  await sleep(700);
  return { ok: !info.covered, why: info.covered ? `${label}: covered by another element` : '' };
}
const byLabel = (l) => `() => document.querySelector('[aria-label="${l}"]')`;
const byExactText = (t, sel = 'button') =>
  `() => [...document.querySelectorAll('${sel}')].find((b) => b.offsetParent !== null && b.textContent.trim().toLowerCase() === ${JSON.stringify(t.toLowerCase())})`;
const byText = (t, sel = 'button') =>
  `() => [...document.querySelectorAll('${sel}')].find((b) => b.offsetParent !== null && b.textContent.trim().toLowerCase().includes(${JSON.stringify(t.toLowerCase())}))`;
const heading = () => evaluate(`(document.querySelector('[data-month-heading]') || document.querySelector('main h2'))?.textContent.trim()`);
const dialogOpen = () => evaluate(`!!document.querySelector('[role=dialog]')`);
const pathNow = () => evaluate('location.pathname');
const key = async (k) => {
  await S('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: k, windowsVirtualKeyCode: k === 'Escape' ? 27 : 0 });
  await S('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: k, windowsVirtualKeyCode: k === 'Escape' ? 27 : 0 });
  await sleep(600);
};

const audit = {};
for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
  await setViewport(w, h, mobile);
  await go('/calendar');
  audit[w] = await evaluate(MEASURE);
  await shot(`calendar-${w}`);
}
writeFileSync(path.join(OUT, 'audit.json'), JSON.stringify(audit, null, 2));

// ---- click-through at phone size ----
await setViewport(390, 844, true);
const steps = [];
const step = async (name, fn) => {
  try { const r = await fn(); steps.push({ name, pass: !!r.pass, detail: r.detail || '' }); }
  catch (e) { steps.push({ name, pass: false, detail: String(e.message || e) }); }
};

await go('/');
await step('route / redirects to /calendar', async () => ({ pass: (await pathNow()) === '/calendar' }));
await go('/does-not-exist');
await step('unknown route redirects to /calendar', async () => ({ pass: (await pathNow()) === '/calendar' }));
await go('/admin');
await step('/admin without a seat redirects to /calendar', async () => ({ pass: (await pathNow()) === '/calendar' }));

await go('/calendar');
const startHeading = await heading();
await step('Next month button', async () => {
  const c = await clickBy(byLabel('Next month'), 'next'); const h = await heading();
  return { pass: c.ok && h !== startHeading, detail: `${startHeading} -> ${h} ${c.why}` };
});
await step('Previous month button', async () => {
  const c = await clickBy(byLabel('Previous month'), 'prev'); const h = await heading();
  return { pass: c.ok && h === startHeading, detail: `-> ${h} ${c.why}` };
});
await step('Today button returns to current month', async () => {
  await clickBy(byLabel('Next month'), 'next'); await clickBy(byLabel('Next month'), 'next');
  const c = await clickBy(byExactText('Today'), 'today'); const h = await heading();
  return { pass: c.ok && h === startHeading, detail: `-> ${h} ${c.why}` };
});
await step('Swipe left changes month', async () => {
  const before = await heading();
  const grid = await evaluate(`(() => { const el = document.querySelector('[data-iso-date]').parentElement; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { y: r.top + r.height/2, x1: r.right - 30, x2: r.left + 30 }; })()`);
  await S('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: grid.x1, y: grid.y }] });
  for (let i = 1; i <= 6; i++) { await S('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: grid.x1 - ((grid.x1 - grid.x2) * i) / 6, y: grid.y }] }); await sleep(16); }
  await S('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(800);
  const after = await heading();
  await clickBy(byExactText('Today'), 'today');
  return { pass: after !== before, detail: `${before} -> ${after}` };
});
await step('Agenda view toggle', async () => {
  const c = await clickBy(byLabel('Agenda list view'), 'agenda');
  const ok = await evaluate(`/agenda/i.test(document.querySelector('main').textContent) && !document.querySelector('[data-iso-date]')`);
  await shot('agenda-390');
  return { pass: c.ok && ok, detail: c.why };
});
await step('Grid view toggle', async () => {
  const c = await clickBy(byLabel('Month grid view'), 'grid');
  return { pass: c.ok && (await evaluate(`document.querySelectorAll('[data-iso-date]').length === 42`)), detail: c.why };
});
await step('Unit filter chips (All + each unit)', async () => {
  const chips = await evaluate(`[...document.querySelectorAll('[data-unit-filter]')].map((b) => b.getAttribute('data-unit-filter'))`);
  const fallback = chips.length ? chips : await evaluate(`(() => { const all = [...document.querySelectorAll('main button')].find((b) => b.textContent.trim() === 'All'); return all ? [...all.parentElement.querySelectorAll('button')].map((b) => b.textContent.trim()) : []; })()`);
  let okAll = fallback.length > 0; const tried = [];
  for (const chip of fallback) {
    const finder = chips.length ? `() => document.querySelector('[data-unit-filter="${chip}"]')`
      : `() => [...document.querySelectorAll('main button')].find((b) => b.textContent.trim() === ${JSON.stringify(chip)})`;
    const c = await clickBy(finder, chip);
    const pressed = await evaluate(`(${finder})()?.getAttribute('aria-pressed')`);
    tried.push(`${chip}${pressed === 'true' ? '*' : ''}`);
    okAll = okAll && c.ok;
  }
  await clickBy(chips.length ? `() => document.querySelector('[data-unit-filter="ALL"]')` : byText('All'), 'All');
  return { pass: okAll, detail: tried.join(' ') };
});
await step('Tap an open day opens the booking sheet', async () => {
  const c = await clickBy(`() => { const t = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
    return [...document.querySelectorAll('[data-iso-date]')].find((b) => b.dataset.isoDate > t && !b.disabled); }`, 'day');
  const open = await dialogOpen();
  const txt = await evaluate(`document.querySelector('[role=dialog]')?.textContent || ''`);
  await shot('day-sheet-390');
  return { pass: c.ok && open && /sign in with google to book/i.test(txt), detail: c.why };
});
await step('Escape closes the sheet', async () => { await key('Escape'); return { pass: !(await dialogOpen()) }; });
await step('Keyboard arrows move focus across day cells', async () => {
  await evaluate(`document.querySelector('[data-iso-date][tabindex="0"]').focus()`);
  const a = await evaluate('document.activeElement.dataset.isoDate');
  await S('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await sleep(200);
  const b = await evaluate('document.activeElement.dataset.isoDate');
  return { pass: Boolean(a && b && a !== b), detail: `${a} -> ${b}` };
});
await step('Header Sign In opens the Google sheet', async () => {
  const c = await clickBy(byText('Sign In', 'header button'), 'sign in');
  const txt = await evaluate(`document.querySelector('[role=dialog]')?.textContent || ''`);
  await shot('signin-sheet-390');
  return { pass: c.ok && /continue with google/i.test(txt), detail: c.why };
});
await step('Close panel button closes the sheet', async () => {
  const c = await clickBy(byLabel('Close panel'), 'close');
  return { pass: c.ok && !(await dialogOpen()), detail: c.why };
});
await step('Backdrop tap closes the sheet', async () => {
  await clickBy(byText('Sign In', 'header button'), 'sign in');
  await S('Input.dispatchMouseEvent', { type: 'mousePressed', x: 195, y: 30, button: 'left', clickCount: 1 });
  await S('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 195, y: 30, button: 'left', clickCount: 1 });
  await sleep(700);
  return { pass: !(await dialogOpen()) };
});
await step('Continue with Google starts the OAuth request', async () => {
  await clickBy(byText('Sign In', 'header button'), 'sign in');
  const requests = [];
  await S('Network.enable');
  const on = (msg) => { if (msg.sessionId === sessionId && msg.method === 'Network.requestWillBeSent') requests.push(msg.params.request.url); };
  listeners.push(on);
  await clickBy(byText('Continue with Google'), 'google');
  await sleep(2500);
  listeners.splice(listeners.indexOf(on), 1);
  const hit = requests.find((u) => /\/api\/auth\/sign-in|accounts\.google\.com/.test(u));
  return { pass: Boolean(hit), detail: hit || requests.slice(0, 3).join(' ') };
});

await go('/calendar');
await setViewport(1440, 900, false);
await go('/calendar');
await shot('calendar-1440');

writeFileSync(path.join(OUT, 'clickthrough.json'), JSON.stringify({ steps, consoleErrors: [...new Set(consoleErrors)].slice(0, 20) }, null, 2));
const passed = steps.filter((s) => s.pass).length;
console.log(`click-through: ${passed}/${steps.length} passed`);
for (const s of steps) console.log(`${s.pass ? 'PASS' : 'FAIL'}  ${s.name}  ${s.detail}`);
console.log(JSON.stringify(audit, null, 1));

browser.close();
chrome.kill();
await sleep(500);
try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
process.exit(0);
