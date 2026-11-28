#!/usr/bin/env node
/**
 * Comprehensive headless Chrome audit for NVMSA landing pages (/, /ar/) and /app/calendar.
 * Usage:
 *   node scripts/verify-landing.mjs [--url http://127.0.0.1:4173] [--out .taste-skill/landing-shots]
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .reduce((acc, v, i, a) => (v.startsWith('--') ? [...acc, [v.slice(2), a[i + 1]]] : acc), []),
);

const BASE = (args.url || 'http://127.0.0.1:4173').replace(/\/$/, '');
const OUT = path.resolve(args.out || '.taste-skill/landing-shots');
mkdirSync(OUT, { recursive: true });

const CHROMES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
];
const chromePath = CHROMES.find((p) => existsSync(p));
if (!chromePath) throw new Error('Chrome/Chromium binary not found');

const profile = mkdtempSync(path.join(tmpdir(), 'nvmsa-landing-audit-'));
const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--mute-audio',
    '--force-color-profile=srgb',
    'about:blank',
  ],
  { stdio: ['ignore', 'ignore', 'pipe'] },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const wsUrl = await new Promise((resolve, reject) => {
  let buf = '';
  chrome.stderr.on('data', (d) => {
    buf += d;
    const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) resolve(m[1]);
  });
  setTimeout(() => reject(new Error('Chrome did not start within 15s')), 15000);
});

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
  } else if (msg.method) {
    listeners.forEach((fn) => fn(msg));
  }
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
  if (msg.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(
      msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text,
    );
  }
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
  }
});

const evaluate = async (expression) => {
  const r = await S('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) {
    throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  }
  return r.result.value;
};

async function setViewport(width, height, mobile) {
  await S('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: mobile ? 2 : 1,
    mobile,
  });
  await S('Emulation.setTouchEmulationEnabled', { enabled: mobile });
}

async function navigate(route, waitSelector = 'main') {
  await S('Page.navigate', { url: BASE + route });
  for (let i = 0; i < 60; i++) {
    await sleep(150);
    const ready = await evaluate(
      `document.readyState === 'complete' && !!document.querySelector(${JSON.stringify(waitSelector)})`,
    ).catch(() => false);
    if (ready) break;
  }
  await sleep(950);
}

async function shot(name) {
  const { data } = await S('Page.captureScreenshot', { format: 'png' });
  writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(data, 'base64'));
}

async function scrollAndAuditImages() {
  return evaluate(`(async () => {
    const step = Math.max(400, Math.floor(window.innerHeight * 0.75));
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 140));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 500));
    const imgs = [...document.querySelectorAll('img')];
    await Promise.all(imgs.map((img) => img.complete && img.naturalWidth > 0 ? Promise.resolve() : new Promise((res) => {
      img.addEventListener('load', res, { once: true });
      img.addEventListener('error', res, { once: true });
      setTimeout(res, 4000);
    })));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 250));
    return imgs.map((img) => ({
      src: img.getAttribute('src'),
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    }));
  })()`);
}

const LAYOUT_AUDIT_FN = `(() => {
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05;
  };
  const overflowX = document.documentElement.scrollWidth - window.innerWidth;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const cache = new Map();
  const parse = (c) => {
    if (cache.has(c)) return cache.get(c);
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = '#000';
    cx.fillStyle = c;
    cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    const v = [d[0], d[1], d[2], d[3] / 255];
    cache.set(c, v);
    return v;
  };
  const lum = ([r, g, b]) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const bgOf = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c[3] > 0.85) return c;
    }
    return [247, 241, 227, 1];
  };
  const textEls = [...document.querySelectorAll('body *')].filter(
    (el) => vis(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0),
  );
  const contrastFailures = [];
  for (const el of textEls) {
    const s = getComputedStyle(el);
    const fg = parse(s.color);
    const bg = bgOf(el);
    const l1 = lum(fg);
    const l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const size = parseFloat(s.fontSize);
    const bold = parseInt(s.fontWeight, 10) >= 700;
    const threshold = size >= 24 || (bold && size >= 18.66) ? 3.0 : 4.5;
    if (ratio < threshold) {
      contrastFailures.push({
        tag: el.tagName.toLowerCase(),
        cls: el.className,
        text: el.textContent.trim().slice(0, 48),
        ratio: Number(ratio.toFixed(2)),
        threshold,
      });
    }
  }
  const smallTargets = [...document.querySelectorAll('a, button')]
    .filter((el) => vis(el) && !el.closest('.faq-item, .unit-highlights, .folio-list, p') && !el.classList.contains('nav-link'))
    .map((el) => ({
      tag: el.tagName.toLowerCase(),
      cls: el.className,
      text: el.textContent.trim().slice(0, 32),
      height: Math.round(el.getBoundingClientRect().height),
      width: Math.round(el.getBoundingClientRect().width),
    }))
    .filter((t) => t.height < 44 || t.width < 44);
  return {
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflowX,
    contrastFailureCount: contrastFailures.length,
    contrastFailures: contrastFailures.slice(0, 8),
    smallTargetCount: smallTargets.length,
    smallTargets: smallTargets.slice(0, 8),
  };
})()`;

const report = {
  base: BASE,
  routes: {},
  interactions: {},
  consoleErrors: [],
};

try {
  // 1. Audit EN landing across 5 viewports
  const viewports = [
    { name: '1440', w: 1440, h: 900, mobile: false },
    { name: '1024', w: 1024, h: 768, mobile: false },
    { name: '768', w: 768, h: 1024, mobile: true },
    { name: '390', w: 390, h: 844, mobile: true },
    { name: '320', w: 320, h: 568, mobile: true },
  ];

  report.routes['/'] = {};
  for (const vp of viewports) {
    await setViewport(vp.w, vp.h, vp.mobile);
    await navigate('/');
    if (vp.name === '1440') {
      const imgs = await scrollAndAuditImages();
      report.routes['/'].images = imgs;
      await shot('en-1440-hero');
      await evaluate(`document.querySelector('#about').scrollIntoView({ behavior: 'instant' })`);
      await sleep(350);
      await shot('en-1440-about');
      await evaluate(`document.querySelector('#team').scrollIntoView({ behavior: 'instant' })`);
      await sleep(350);
      await shot('en-1440-team');
      await evaluate(`document.querySelector('#impact').scrollIntoView({ behavior: 'instant' })`);
      await sleep(950);
      await shot('en-1440-impact');
      await evaluate(`document.querySelector('#committees').scrollIntoView({ behavior: 'instant' })`);
      await sleep(450);
      await shot('en-1440-committees');
      await evaluate(`document.querySelector('#campaigns').scrollIntoView({ behavior: 'instant' })`);
      await sleep(850);
      await shot('en-1440-campaigns');
      await evaluate(`document.querySelector('#history').scrollIntoView({ behavior: 'instant' })`);
      await sleep(350);
      await shot('en-1440-history');
      await evaluate(`window.scrollTo(0, 0)`);
      await sleep(150);
    }
    if (vp.name === '390') {
      await shot('en-390-hero');
    }
    report.routes['/'][vp.name] = await evaluate(LAYOUT_AUDIT_FN);
  }

  // 2. Test interactive controls + reduced motion on EN
  await setViewport(1440, 900, false);
  await navigate('/');
  report.interactions.teamFilter = await evaluate(`(() => {
    const ebBtn = document.querySelector('[data-team-filter="eb"]');
    ebBtn.click();
    const scHidden = document.querySelector('[data-team-group="sc"]').hidden;
    const ebVisible = !document.querySelector('[data-team-group="eb"]').hidden;
    document.querySelector('[data-team-filter="all"]').click();
    const sampleBtn = document.getElementById('sample-toggle');
    sampleBtn.click();
    const sampleOpen = !document.getElementById('sample-panel').hidden;
    sampleBtn.click();
    return { scHidden, ebVisible, sampleOpen };
  })()`);

  report.interactions.impactLens = await evaluate(`(() => {
    document.querySelector('[data-impact-lens="activities"]').click();
    const scomeActivities = document.querySelector('[data-sc="SCOME"] [data-bar-value]').textContent;
    document.querySelector('[data-impact-lens="online"]').click();
    const scomeOnline = document.querySelector('[data-sc="SCOME"] [data-bar-value]').textContent;
    return { scomeActivities, scomeOnline };
  })()`);

  report.interactions.committees = await evaluate(`(() => {
    document.querySelector('[data-unit-tab="PNSD"]').click();
    const pnsdVisible = !document.querySelector('[data-unit-panel="PNSD"]').hidden;
    const scophHidden = document.querySelector('[data-unit-panel="SCOPH"]').hidden;
    return { pnsdVisible, scophHidden };
  })()`);

  report.interactions.history = await evaluate(`(() => {
    document.querySelector('[data-term-tab="2024-2025"]').click();
    const pastVisible = !document.querySelector('[data-term-panel="2024-2025"]').hidden;
    document.querySelector('[data-term-tab="2025-2026"]').click();
    return { pastVisible };
  })()`);

  report.interactions.copyToast = await evaluate(`(async () => {
    document.querySelector('[data-copy-email]').click();
    await new Promise((r) => setTimeout(r, 80));
    const toast = document.getElementById('copy-toast');
    return { shown: !toast.hidden, text: toast.textContent };
  })()`);

  // Reduced motion check
  await S('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await sleep(100);
  report.interactions.reducedMotionHeroOpacity = await evaluate(
    `getComputedStyle(document.querySelector('.hero-line > span')).opacity`,
  );
  await S('Emulation.setEmulatedMedia', { features: [] });

  // Mobile drawer check
  await setViewport(390, 844, true);
  await navigate('/');
  report.interactions.mobileDrawer = await evaluate(`(() => {
    const toggle = document.getElementById('menu-toggle');
    const drawer = document.getElementById('mobile-drawer');
    const close = document.getElementById('menu-close');
    toggle.click();
    const opened = !drawer.hidden;
    close.click();
    const closed = drawer.hidden;
    return { opened, closed };
  })()`);

  // 3. Audit AR landing across all 5 viewports
  report.routes['/ar/'] = {};
  for (const vp of viewports) {
    await setViewport(vp.w, vp.h, vp.mobile);
    await navigate('/ar/');
    if (vp.name === '1440') {
      const imgs = await scrollAndAuditImages();
      report.routes['/ar/'].images = imgs;
      await shot('ar-1440-hero');
      await evaluate(`document.querySelector('#team').scrollIntoView({ behavior: 'instant' })`);
      await sleep(250);
      await shot('ar-1440-team');
      await evaluate(`window.scrollTo(0, 0)`);
      await sleep(150);
    }
    if (vp.name === '390') {
      await shot('ar-390-hero');
    }
    report.routes['/ar/'][vp.name] = await evaluate(LAYOUT_AUDIT_FN);
  }

  // 4. Verify HTTP 301 redirect from /calendar -> /nvmsaOs/calendar and audit NVMSA OS at /nvmsaOs/calendar
  const redirectRes = await fetch(`${BASE}/calendar?ym=2026-12`, { redirect: 'manual' });
  report.redirects = {
    calendarStatus: redirectRes.status,
    calendarLocation: redirectRes.headers.get('location'),
  };

  report.routes['/nvmsaOs/calendar'] = {};
  for (const vp of [
    { name: '1440', w: 1440, h: 900, mobile: false },
    { name: '390', w: 390, h: 844, mobile: true },
  ]) {
    await setViewport(vp.w, vp.h, vp.mobile);
    await navigate('/nvmsaOs/calendar', 'header, main');
    await sleep(600);
    if (vp.name === '1440') {
      await shot('app-1440-calendar');
    }
    report.routes['/nvmsaOs/calendar'][vp.name] = await evaluate(`({
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      hasRootContent: (document.getElementById('root')?.innerText?.trim().length ?? 0) > 20,
      hasHomeLink: !!document.querySelector('a[href="/"]'),
    })`);
  }

  report.consoleErrors = consoleErrors;
  writeFileSync(path.join(OUT, 'audit.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  browser.close();
  chrome.kill();
  await sleep(350);
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch {
    // Ignore leftover Chrome lock files on exit
  }
}
