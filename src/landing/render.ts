import { LANDING_CONTENT, type Locale, type OfficialSeat } from './content.ts';

function esc(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getInitials(name: string | null): string {
  if (!name) return 'NV';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0] ?? 'NV').slice(0, 2);
  return `${(parts[0] ?? '')[0] ?? ''}${(parts[parts.length - 1] ?? '')[0] ?? ''}`;
}

function parseCountSpec(raw: string): { target: number; suffix: string } | null {
  const cleaned = raw.replaceAll(',', '').trim();
  const match = /^(\d+)(.*)$/.exec(cleaned);
  if (!match) return null;
  const target = Number(match[1]);
  if (!Number.isFinite(target)) return null;
  return { target, suffix: match[2] ?? '' };
}

function renderIconCopy(): string {
  return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
}

function renderIconMail(): string {
  return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>';
}

function renderIconChat(): string {
  return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
}

function renderIconMenu(): string {
  return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
}

function renderIconClose(): string {
  return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
}

function renderSeatActions(
  seat: OfficialSeat,
  copyLabel: string,
  whatsappLabel: string,
  emailLabel: string,
): string {
  const waBtn = seat.whatsappHref
    ? `<a class="btn-chip btn-chip--wa" href="${esc(seat.whatsappHref)}" target="_blank" rel="noopener noreferrer">${renderIconChat()}<span>${esc(whatsappLabel)}</span></a>`
    : '';
  const mailBtn = `<a class="btn-chip" href="mailto:${esc(seat.email)}">${renderIconMail()}<span>${esc(emailLabel)}</span></a>`;
  const copyBtn = `<button type="button" class="btn-chip btn-chip--icon" data-copy-email="${esc(seat.email)}" aria-label="${esc(copyLabel)}: ${esc(seat.email)}" title="${esc(copyLabel)}">${renderIconCopy()}</button>`;
  return `${waBtn}${mailBtn}${copyBtn}`;
}

const COALITION_UNITS: Record<Locale, string[]> = {
  en: [
    'Faculty of Medicine — NVU',
    'Safe Women Unit (NVU)',
    'Y-PEER Network',
    'UNFPA & Misr Foundation',
    'Coffee & Book Kharga',
    'AMSA-Aswan',
    'LMSA-Luxor',
    'MSSA-Minya',
    'ASSA-Assiut',
    'SMSA-Suez',
    'MSSA-Menofia',
    'BSSS-Banha',
    'AMSA-Azhar Cairo',
    'MMSA-MUST',
    'NMSA-Nahda',
    'HMSA-Horus',
    'OSSS-6th October',
    'ANSSA-Alexandria',
  ],
  ar: [
    'كلية الطب — جامعة الوادي الجديد',
    'وحدة المرأة الآمنة (NVU)',
    'شبكة Y-PEER',
    'ورش UNFPA ومؤسسة مصر',
    'Coffee & Book الخارجة',
    'AMSA-أسوان',
    'LMSA-الأقصر',
    'MSSA-المنيا',
    'ASSA-أسيوط',
    'SMSA-السويس',
    'MSSA-المنوفية',
    'BSSS-بنها',
    'AMSA-الأزهر القاهرة',
    'MMSA-MUST',
    'NMSA-النهضة',
    'HMSA-حورس',
    'OSSS-6 أكتوبر',
    'ANSSA-الإسكندرية الأهلية',
  ],
};

export function renderLandingPage(locale: Locale): string {
  const c = LANDING_CONTENT[locale];
  const isAr = locale === 'ar';
  const canonicalUrl = isAr ? 'https://nvmsa.us/ar/' : 'https://nvmsa.us/';

  const ebSeats = c.officials.filter((o) => o.organ === 'eb');
  const scSeats = c.officials.filter((o) => o.organ === 'sc');
  const sdSeats = c.officials.filter((o) => o.organ === 'sd');

  const maxOnline = Math.max(...c.impact.committees.map((x) => x.onlineReach));
  const maxSdSessions = Math.max(...c.impact.sdRows.map((x) => x.sessions));

  const renderLedgerRows = (rows: OfficialSeat[]) =>
    rows
      .map(
        (seat) => `
          <tr class="ledger-row" data-organ-item="${seat.organ}">
            <td class="ledger-code">
              <span class="seat-badge">${esc(seat.code)}</span>
              ${seat.unitTag ? `<span class="seat-unit">${esc(seat.unitTag)}</span>` : ''}
            </td>
            <td class="ledger-role">${esc(seat.title)}</td>
            <td class="ledger-person">
              ${
                seat.name
                  ? `<span class="person-name">${esc(seat.name)}</span>`
                  : `<span class="person-vacant">${esc(seat.vacantLabel ?? '')}</span>`
              }
              <span class="person-email" dir="ltr">${esc(seat.email)}</span>
              ${seat.whatsapp ? `<span class="person-phone" dir="ltr">${esc(seat.whatsapp)}</span>` : ''}
            </td>
            <td class="ledger-actions">
              <div class="action-row">
                ${renderSeatActions(seat, c.team.copyEmailLabel, c.team.whatsappLabel, c.team.emailLabel)}
              </div>
            </td>
          </tr>`,
      )
      .join('');

  const coalitionPills = COALITION_UNITS[locale]
    .map((label) => `<span class="coalition-pill">${esc(label)}</span>`)
    .join('');

  const fontsHref = isAr
    ? 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Readex+Pro:wght@400;500;600;700&display=swap'
    : 'https://fonts.googleapis.com/css2?family=Chivo:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap';

  return `<!doctype html>
<html lang="${c.lang}" dir="${c.dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>${esc(c.meta.title)}</title>
  <meta name="description" content="${esc(c.meta.description)}" />
  <meta name="theme-color" content="#F7F1E3" />
  <link rel="canonical" href="${canonicalUrl}" />
  <link rel="alternate" hreflang="en" href="https://nvmsa.us/" />
  <link rel="alternate" hreflang="ar" href="https://nvmsa.us/ar/" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${esc(c.meta.title)}" />
  <meta property="og:description" content="${esc(c.meta.description)}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="/brand/nvmsa-horizontal.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="${fontsHref}" />
  <link rel="stylesheet" href="/src/landing/landing.css" />
  <script>document.documentElement.classList.add('nv-anim');setTimeout(function(){document.documentElement.classList.add('nv-ready');},650);</script>
</head>
<body>
  <a class="skip-link" href="#main-content">${esc(c.skipToContent)}</a>

  <header class="site-header" id="site-header">
    <div class="wrap header-inner">
      <a class="brand-lockup" href="#top">
        <span class="brand-emblem">
          <img src="/brand/nvmsa-emblem.png" width="40" height="40" alt="NVMSA Hibis Temple" decoding="async" />
        </span>
        <span class="brand-text">
          <span class="brand-name">${esc(c.nav.brandName)}</span>
          <span class="brand-sub">${esc(c.nav.brandSub)}</span>
        </span>
      </a>

      <nav class="primary-nav" aria-label="${isAr ? 'التنقل الرئيسي' : 'Primary navigation'}">
        ${c.nav.links
          .map((item) => `<a class="nav-link" href="${item.href}">${esc(item.label)}</a>`)
          .join('')}
      </nav>

      <div class="header-actions">
        <a class="lang-switch" href="${c.alternatePath}" data-lang-switch hreflang="${isAr ? 'en' : 'ar'}">${esc(c.alternateLabel)}</a>
        <a class="btn btn--os" href="/nvmsaOs/calendar">${esc(c.nav.osLabel)}</a>
        <button
          type="button"
          class="menu-toggle"
          id="menu-toggle"
          aria-expanded="false"
          aria-controls="mobile-drawer"
          aria-label="${esc(c.nav.menuOpenLabel)}"
        >
          ${renderIconMenu()}
        </button>
      </div>
    </div>
    <div class="scroll-progress" id="scroll-progress" aria-hidden="true"></div>
  </header>

  <div class="mobile-drawer" id="mobile-drawer" hidden>
    <div class="mobile-drawer__panel" role="dialog" aria-modal="true" aria-label="${esc(c.nav.menuOpenLabel)}">
      <div class="mobile-drawer__top">
        <span class="brand-name">${esc(c.nav.brandName)}</span>
        <button type="button" class="menu-close" id="menu-close" aria-label="${esc(c.nav.menuCloseLabel)}">
          ${renderIconClose()}
        </button>
      </div>
      <nav class="mobile-nav">
        ${c.nav.links
          .map((item) => `<a class="mobile-nav__link" href="${item.href}">${esc(item.label)}</a>`)
          .join('')}
      </nav>
      <div class="mobile-drawer__foot">
        <a class="btn btn--primary btn--full" href="/nvmsaOs/calendar">${esc(c.nav.osLabel)}</a>
        <a class="btn btn--outline btn--full" href="${c.alternatePath}" data-lang-switch>${esc(c.alternateLabel)}</a>
      </div>
    </div>
  </div>

  <main id="main-content">
    <section class="hero" id="top" aria-labelledby="hero-heading">
      <div class="hero-atmosphere" aria-hidden="true">
        <span class="hero-orb hero-orb--sun"></span>
        <span class="hero-orb hero-orb--warm"></span>
        <div class="hero-motes">
          <span></span><span></span><span></span><span></span><span></span><span></span>
        </div>
      </div>

      <div class="wrap hero-grid">
        <div class="hero-copy">
          <p class="hero-place">${esc(c.hero.locationLine)}</p>

          <div class="ecg-stage" aria-hidden="true">
            <svg class="ecg-svg" viewBox="0 0 420 60" fill="none" preserveAspectRatio="xMinYMid meet">
              <defs>
                <linearGradient id="nv-ecg-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#D98806" />
                  <stop offset="45%" stop-color="#FFCA3A" />
                  <stop offset="72%" stop-color="#FFE680" />
                  <stop offset="100%" stop-color="#E59400" />
                </linearGradient>
                <filter id="nv-ecg-bloom" x="-15%" y="-60%" width="130%" height="220%">
                  <feGaussianBlur stdDeviation="2.6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <line class="ecg-baseline" x1="0" y1="34" x2="420" y2="34" />
              <path
                class="ecg-pulse-glow"
                pathLength="1"
                d="M0 34 L78 34 L92 27 L104 34 L120 34 L128 41 L140 8 L152 52 L162 34 L182 34 C192 23 204 23 214 34 L252 34 C252 18 268 12 278 22 C288 12 304 18 304 34 C304 44 292 49 278 54 C264 49 252 44 252 34 L420 34"
              />
              <path
                class="ecg-pulse"
                pathLength="1"
                stroke="url(#nv-ecg-grad)"
                filter="url(#nv-ecg-bloom)"
                d="M0 34 L78 34 L92 27 L104 34 L120 34 L128 41 L140 8 L152 52 L162 34 L182 34 C192 23 204 23 214 34 L252 34 C252 18 268 12 278 22 C288 12 304 18 304 34 C304 44 292 49 278 54 C264 49 252 44 252 34 L420 34"
              />
              <path
                class="ecg-pulse-wave"
                pathLength="1"
                d="M0 34 L78 34 L92 27 L104 34 L120 34 L128 41 L140 8 L152 52 L162 34 L182 34 C192 23 204 23 214 34 L252 34 C252 18 268 12 278 22 C288 12 304 18 304 34 C304 44 292 49 278 54 C264 49 252 44 252 34 L420 34"
              />
              <circle class="ecg-heart-beacon" cx="278" cy="31" r="3.6" />
            </svg>
          </div>

          <h1 class="hero-title" id="hero-heading">
            ${c.hero.headlineLines
              .map(
                (line, idx) =>
                  `<span class="hero-line" style="--line-i:${idx}"><span>${esc(line)}</span></span>`,
              )
              .join('')}
          </h1>

          <p class="hero-lead">${esc(c.hero.lead)}</p>

          <div class="hero-cta-row">
            <a class="btn btn--primary btn--radiant" href="#team">${esc(c.hero.primaryCta)}</a>
            <a class="btn btn--outline" href="#impact">${esc(c.hero.secondaryCta)}</a>
          </div>
        </div>

        <div class="hero-stage">
          <svg class="temple-columns" viewBox="0 0 560 420" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="nv-col-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#F6C453" stop-opacity="0.46" />
                <stop offset="100%" stop-color="#B77815" stop-opacity="0.14" />
              </linearGradient>
            </defs>
            <g class="col-silhouette col-silhouette--left">
              <rect x="18" y="34" width="38" height="366" rx="3" fill="url(#nv-col-grad)" />
              <path d="M10 34h54l-7 18H17L10 34z" fill="url(#nv-col-grad)" />
              <rect x="14" y="388" width="46" height="14" rx="2" fill="url(#nv-col-grad)" />
            </g>
            <g class="col-silhouette col-silhouette--right">
              <rect x="504" y="34" width="38" height="366" rx="3" fill="url(#nv-col-grad)" />
              <path d="M496 34h54l-7 18h-40l-7-18z" fill="url(#nv-col-grad)" />
              <rect x="500" y="388" width="46" height="14" rx="2" fill="url(#nv-col-grad)" />
            </g>
            <g class="col-lintel">
              <rect x="8" y="14" width="544" height="20" rx="3" fill="url(#nv-col-grad)" />
              <circle cx="280" cy="24" r="7" fill="#F3B43F" fill-opacity="0.72" />
            </g>
          </svg>
          <figure class="hero-photo-frame">
            <img
              src="/landing/img/photo-f56499953-960.jpg"
              srcset="/landing/img/photo-f56499953-500.jpg 500w, /landing/img/photo-f56499953-960.jpg 960w, /landing/img/photo-f56499953.jpg 1280w"
              sizes="(max-width: 900px) 92vw, 44vw"
              width="1280"
              height="853"
              alt="${esc(c.hero.photoAlt)}"
              fetchpriority="high"
              decoding="async"
            />
          </figure>
        </div>
      </div>

      <div class="wrap hero-facts" aria-label="${isAr ? 'مؤشرات سريعة' : 'Key facts'}">
        ${c.hero.facts
          .map((fact, idx) => {
            const spec = parseCountSpec(fact.value);
            const countAttrs = spec
              ? ` data-count-to="${spec.target}" data-count-suffix="${esc(spec.suffix)}"`
              : '';
            return `
          <div class="hero-fact" style="--stagger-i:${idx}">
            <span class="hero-fact__val" dir="ltr"${countAttrs}>${esc(fact.value)}</span>
            <span class="hero-fact__label">${esc(fact.label)}</span>
          </div>`;
          })
          .join('')}
      </div>
    </section>

    <section class="band band--limestone" id="about" aria-labelledby="about-heading">
      <div class="wrap about-grid">
        <div class="about-narrative" data-reveal="up">
          <h2 class="section-heading" id="about-heading">${esc(c.about.heading)}</h2>
          <p class="section-intro">${esc(c.about.intro)}</p>
          ${c.about.paragraphs.map((p) => `<p class="body-copy">${esc(p)}</p>`).join('')}
          <div class="pillar-list">
            ${c.about.pillars
              .map(
                (pillar, idx) => `
              <article class="pillar-item" data-reveal="up" style="--stagger-i:${idx}">
                <h3>${esc(pillar.title)}</h3>
                <p>${esc(pillar.body)}</p>
              </article>`,
              )
              .join('')}
          </div>
        </div>

        <div class="about-gallery">
          <div class="photo-frame photo-frame--wide" data-reveal="curtain" data-parallax="-12">
            <img
              src="/landing/img/photo-f5411325-960.jpg"
              srcset="/landing/img/photo-f5411325-500.jpg 500w, /landing/img/photo-f5411325-960.jpg 960w, /landing/img/photo-f5411325.jpg 1280w"
              sizes="(max-width: 900px) 92vw, 44vw"
              width="1280"
              height="962"
              alt="${esc(c.about.oasisPhotoAlt)}"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div class="photo-frame photo-frame--inset" data-reveal="curtain" data-parallax="14" style="--stagger-i:2">
            <img
              src="/landing/img/photo-f5447754-960.jpg"
              srcset="/landing/img/photo-f5447754-500.jpg 500w, /landing/img/photo-f5447754-960.jpg 960w"
              sizes="(max-width: 900px) 92vw, 32vw"
              width="960"
              height="722"
              alt="${esc(c.about.colonnadePhotoAlt)}"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>

    <div class="coalition-ribbon" aria-label="${isAr ? 'شبكة التعاون واللجان الشقيقة' : 'Partner and sister committee network'}">
      <div class="coalition-marquee">
        <div class="coalition-track">${coalitionPills}</div>
        <div class="coalition-track" aria-hidden="true">${coalitionPills}</div>
      </div>
    </div>

    <section class="band band--sandstone" id="team" aria-labelledby="team-heading">
      <div class="wrap">
        <div class="section-head-split" data-reveal="up">
          <div>
            <span class="term-pill">${esc(c.team.termBadge)}</span>
            <h2 class="section-heading" id="team-heading">${esc(c.team.heading)}</h2>
            <p class="section-intro">${esc(c.team.intro)}</p>
          </div>
          <div class="filter-bar" role="group" aria-label="${esc(c.team.heading)}">
            ${c.team.filters
              .map(
                (f, i) => `
              <button
                type="button"
                class="filter-btn${i === 0 ? ' is-active' : ''}"
                data-team-filter="${f.id}"
                aria-pressed="${i === 0 ? 'true' : 'false'}"
              >
                <span>${esc(f.label)}</span>
                <span class="filter-count">${f.count}</span>
              </button>`,
              )
              .join('')}
          </div>
        </div>

        <div class="team-group" data-team-group="eb">
          <h3 class="group-heading" data-reveal="up">${esc(c.team.ebHeading)}</h3>
          <div class="eb-grid">
            ${ebSeats
              .map(
                (seat, idx) => `
              <article class="eb-plaque" data-reveal="scale" data-spotlight style="--stagger-i:${idx}">
                <div class="eb-plaque__top">
                  <div class="eb-plaque__id">
                    <span class="eb-monogram" aria-hidden="true">${esc(getInitials(seat.name))}</span>
                    <span class="seat-badge seat-badge--gold">${esc(seat.code)}</span>
                  </div>
                  <span class="eb-plaque__title">${esc(seat.title)}</span>
                </div>
                <h4 class="eb-plaque__name">${esc(seat.name ?? '')}</h4>
                <div class="eb-plaque__meta">
                  <span dir="ltr">${esc(seat.email)}</span>
                  ${seat.whatsapp ? `<span dir="ltr">${esc(seat.whatsapp)}</span>` : ''}
                </div>
                <div class="action-row">
                  ${renderSeatActions(seat, c.team.copyEmailLabel, c.team.whatsappLabel, c.team.emailLabel)}
                </div>
              </article>`,
              )
              .join('')}
          </div>
        </div>

        <div class="team-group" data-team-group="sc" data-reveal="up">
          <h3 class="group-heading">${esc(c.team.scHeading)}</h3>
          <div class="ledger-wrap">
            <table class="officials-ledger">
              <thead>
                <tr>
                  <th scope="col">${esc(c.team.columns.code)}</th>
                  <th scope="col">${esc(c.team.columns.role)}</th>
                  <th scope="col">${esc(c.team.columns.official)}</th>
                  <th scope="col">${esc(c.team.columns.contact)}</th>
                </tr>
              </thead>
              <tbody>
                ${renderLedgerRows(scSeats)}
              </tbody>
            </table>
          </div>
        </div>

        <div class="team-group" data-team-group="sd" data-reveal="up">
          <h3 class="group-heading">${esc(c.team.sdHeading)}</h3>
          <div class="ledger-wrap">
            <table class="officials-ledger">
              <thead>
                <tr>
                  <th scope="col">${esc(c.team.columns.code)}</th>
                  <th scope="col">${esc(c.team.columns.role)}</th>
                  <th scope="col">${esc(c.team.columns.official)}</th>
                  <th scope="col">${esc(c.team.columns.contact)}</th>
                </tr>
              </thead>
              <tbody>
                ${renderLedgerRows(sdSeats)}
              </tbody>
            </table>
          </div>
        </div>

        <div class="sample-block" data-reveal="up">
          <button
            type="button"
            class="btn btn--outline"
            id="sample-toggle"
            aria-expanded="false"
            aria-controls="sample-panel"
            data-label-closed="${esc(c.team.sampleToggleClosed)}"
            data-label-open="${esc(c.team.sampleToggleOpen)}"
          >${esc(c.team.sampleToggleClosed)}</button>

          <div class="sample-panel" id="sample-panel" hidden>
            <p class="sample-notice">${esc(c.team.sampleNotice)}</p>
            <div class="sample-grid">
              ${c.team.sampleCoordinators
                .map(
                  (item) => `
                <article class="sample-card">
                  <span class="seat-badge">${esc(item.unit)}</span>
                  <h4>${esc(item.name)}</h4>
                  <p class="sample-role">${esc(item.role)}</p>
                  <p class="sample-focus">${esc(item.focus)}</p>
                </article>`,
                )
                .join('')}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="band band--night" id="impact" aria-labelledby="impact-heading">
      <div class="night-aura" aria-hidden="true"></div>
      <div class="wrap night-content">
        <div class="night-head" data-reveal="up">
          <h2 class="section-heading section-heading--night" id="impact-heading">${esc(c.impact.heading)}</h2>
          <p class="section-intro section-intro--night">${esc(c.impact.intro)}</p>
        </div>

        <div class="kpi-grid">
          ${c.impact.kpis
            .map((kpi, idx) => {
              const spec = parseCountSpec(kpi.value);
              const countAttrs = spec
                ? ` data-count-to="${spec.target}" data-count-suffix="${esc(spec.suffix)}"`
                : '';
              return `
            <article class="kpi-slab" data-reveal="scale" data-spotlight style="--stagger-i:${idx}">
              <div class="kpi-val" dir="ltr"${countAttrs}>${esc(kpi.value)}</div>
              <h3 class="kpi-label">${esc(kpi.label)}</h3>
              <p class="kpi-detail">${esc(kpi.detail)}</p>
            </article>`;
            })
            .join('')}
        </div>

        <div class="impact-explorer">
          <div class="impact-panel" data-reveal="up">
            <div class="impact-panel__head">
              <h3>${esc(c.impact.lensHeading)}</h3>
              <div class="lens-tabs" role="tablist" aria-label="${esc(c.impact.lensHeading)}">
                ${c.impact.lenses
                  .map(
                    (lens, idx) => `
                  <button
                    type="button"
                    role="tab"
                    class="lens-tab${idx === 0 ? ' is-active' : ''}"
                    data-impact-lens="${lens.id}"
                    aria-selected="${idx === 0 ? 'true' : 'false'}"
                  >${esc(lens.label)}</button>`,
                  )
                  .join('')}
              </div>
            </div>

            <div class="bars-list" id="impact-bars">
              ${c.impact.committees
                .map((row) => {
                  const ratio = (row.onlineReach / maxOnline).toFixed(4);
                  return `
                <div
                  class="bar-row"
                  data-sc="${row.code}"
                  data-online="${row.onlineReach}"
                  data-online-display="${esc(row.onlineDisplay)}"
                  data-activities="${row.activities}"
                  data-sessions="${row.sessions}"
                  data-participants="${row.participants}"
                >
                  <div class="bar-row__meta">
                    <span class="bar-code">${esc(row.code)}</span>
                    <span class="bar-name">${esc(row.name)}</span>
                    <span class="bar-value" data-bar-value>${esc(row.onlineDisplay)}</span>
                  </div>
                  <div class="bar-track">
                    <span class="bar-fill" style="--ratio:${ratio}"></span>
                  </div>
                </div>`;
                })
                .join('')}
            </div>
          </div>

          <div class="impact-side" data-reveal="up" style="--stagger-i:2">
            <div class="sd-panel">
              <h3>${esc(c.impact.sdHeading)}</h3>
              <div class="sd-list">
                ${c.impact.sdRows
                  .map((sd) => {
                    const ratio = (sd.sessions / maxSdSessions).toFixed(4);
                    return `
                  <div class="sd-row">
                    <span class="sd-code">${esc(sd.code)}</span>
                    <div class="sd-track">
                      <span class="sd-fill" style="--ratio:${ratio}"></span>
                    </div>
                    <span class="sd-val">${sd.sessions} ${esc(c.impact.sdUnitLabel)}</span>
                  </div>`;
                  })
                  .join('')}
              </div>
            </div>

            <div class="sdg-panel">
              <h3>${esc(c.impact.sdgHeading)}</h3>
              <ul class="sdg-list">
                ${c.impact.sdgs.map((sdg) => `<li>${esc(sdg)}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="band band--sandstone" id="committees" aria-labelledby="committees-heading">
      <div class="wrap">
        <div data-reveal="up">
          <h2 class="section-heading" id="committees-heading">${esc(c.committees.heading)}</h2>
          <p class="section-intro">${esc(c.committees.intro)}</p>
        </div>

        <div class="atlas-layout" data-reveal="up">
          <div class="atlas-rail" role="tablist" aria-label="${esc(c.committees.heading)}">
            <p class="rail-group-label">${esc(c.committees.scGroupLabel)}</p>
            <div class="rail-buttons">
              ${c.committees.units
                .filter((u) => u.group === 'sc')
                .map(
                  (u, idx) => `
                <button
                  type="button"
                  role="tab"
                  class="rail-btn${idx === 0 ? ' is-active' : ''}"
                  id="tab-${esc(u.id)}"
                  aria-controls="panel-${esc(u.id)}"
                  aria-selected="${idx === 0 ? 'true' : 'false'}"
                  data-unit-tab="${esc(u.id)}"
                >
                  <span class="rail-btn__code">${esc(u.code)}</span>
                  <span class="rail-btn__name">${esc(u.name)}</span>
                </button>`,
                )
                .join('')}
            </div>

            <p class="rail-group-label">${esc(c.committees.sdGroupLabel)}</p>
            <div class="rail-buttons">
              ${c.committees.units
                .filter((u) => u.group === 'sd')
                .map(
                  (u) => `
                <button
                  type="button"
                  role="tab"
                  class="rail-btn"
                  id="tab-${esc(u.id)}"
                  aria-controls="panel-${esc(u.id)}"
                  aria-selected="false"
                  data-unit-tab="${esc(u.id)}"
                >
                  <span class="rail-btn__code">${esc(u.code)}</span>
                  <span class="rail-btn__name">${esc(u.name)}</span>
                </button>`,
                )
                .join('')}
            </div>
          </div>

          <div class="atlas-panels">
            ${c.committees.units
              .map(
                (u, idx) => `
              <article
                class="unit-dossier${idx === 0 ? ' is-active' : ''}"
                data-spotlight
                role="tabpanel"
                id="panel-${esc(u.id)}"
                aria-labelledby="tab-${esc(u.id)}"
                data-unit-panel="${esc(u.id)}"
                ${idx === 0 ? '' : 'hidden'}
              >
                <div class="unit-dossier__head">
                  <span class="seat-badge seat-badge--gold">${esc(u.code)}</span>
                  <span class="unit-stat-line">${esc(u.statLine)}</span>
                </div>
                <h3>${esc(u.name)}</h3>
                <p class="unit-summary">${esc(u.summary)}</p>

                <div class="unit-officer-box">
                  <span class="unit-officer-label">${esc(c.committees.officerLabel)}</span>
                  <div class="unit-officer-row">
                    <strong>${esc(u.officerCode)}${u.officerName ? ` — ${esc(u.officerName)}` : ''}</strong>
                    <a class="text-link" href="mailto:${esc(u.officerEmail)}" dir="ltr">${esc(u.officerEmail)}</a>
                  </div>
                </div>

                <h4>${esc(c.committees.highlightsLabel)}</h4>
                <ul class="unit-highlights">
                  ${u.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}
                </ul>
              </article>`,
              )
              .join('')}
          </div>
        </div>
      </div>
    </section>

    <section class="band band--limestone" id="campaigns" aria-labelledby="campaigns-heading">
      <div class="wrap">
        <div data-reveal="up">
          <h2 class="section-heading" id="campaigns-heading">${esc(c.campaigns.heading)}</h2>
          <p class="section-intro">${esc(c.campaigns.intro)}</p>
        </div>

        <div class="campaigns-grid">
          ${c.campaigns.items
            .map(
              (item, idx) => `
            <article class="campaign-entry" data-reveal="up" data-spotlight style="--stagger-i:${idx}">
              <div class="campaign-entry__meta">
                <span class="campaign-tag">${esc(item.tag)}</span>
                <span class="campaign-metric">${esc(item.metric)}</span>
              </div>
              <h3>${esc(item.title)}</h3>
              <p>${esc(item.summary)}</p>
              <p class="campaign-partners">${esc(item.partners)}</p>
            </article>`,
            )
            .join('')}
        </div>
      </div>
    </section>

    <section class="band band--sandstone" id="history" aria-labelledby="history-heading">
      <div class="wrap">
        <div class="section-head-split" data-reveal="up">
          <div>
            <h2 class="section-heading" id="history-heading">${esc(c.history.heading)}</h2>
            <p class="section-intro">${esc(c.history.intro)}</p>
          </div>
          <div class="term-tabs" role="tablist" aria-label="${esc(c.history.heading)}">
            ${c.history.terms
              .map(
                (t, idx) => `
              <button
                type="button"
                role="tab"
                class="term-tab${idx === 0 ? ' is-active' : ''}"
                id="term-tab-${esc(t.id)}"
                aria-controls="term-panel-${esc(t.id)}"
                aria-selected="${idx === 0 ? 'true' : 'false'}"
                data-term-tab="${esc(t.id)}"
              >${esc(t.label)}</button>`,
              )
              .join('')}
          </div>
        </div>

        <div class="history-folios" data-reveal="up">
          ${c.history.terms
            .map(
              (term, idx) => `
            <article
              class="history-folio${idx === 0 ? ' is-active' : ''}"
              role="tabpanel"
              id="term-panel-${esc(term.id)}"
              aria-labelledby="term-tab-${esc(term.id)}"
              data-term-panel="${esc(term.id)}"
              ${idx === 0 ? '' : 'hidden'}
            >
              <div class="folio-head">
                <div>
                  ${
                    term.status === 'placeholder'
                      ? `<span class="placeholder-tag">${esc(c.history.placeholderBadge)}</span>`
                      : ''
                  }
                  <h3>${esc(term.themeTitle)}</h3>
                  <p class="folio-metrics-line">${esc(term.metricsLine)}</p>
                </div>
              </div>

              <div class="folio-grid">
                <div class="folio-story">
                  <h4>${esc(c.history.presidentLabel)}</h4>
                  <blockquote class="president-quote">
                    <p>${esc(term.presidentQuote)}</p>
                    <footer>${esc(term.presidentName)}</footer>
                  </blockquote>

                  <h4>${esc(c.history.summaryLabel)}</h4>
                  <ul class="folio-list">
                    ${term.executiveSummary.map((line) => `<li>${esc(line)}</li>`).join('')}
                  </ul>

                  <div class="folio-highlights">
                    ${term.highlights.map((hl) => `<span class="highlight-chip">${esc(hl)}</span>`).join('')}
                  </div>
                </div>

                <div class="folio-roster">
                  <h4>${esc(c.history.rosterLabel)}</h4>
                  <ul class="past-roster-list">
                    ${term.officials
                      .map(
                        (off) => `
                      <li>
                        <span class="past-pos">${esc(off.position)}</span>
                        <span class="past-name">${esc(off.name)}</span>
                        <span class="past-email" dir="ltr">${esc(off.email)}</span>
                      </li>`,
                      )
                      .join('')}
                  </ul>
                </div>
              </div>
            </article>`,
            )
            .join('')}
        </div>
      </div>
    </section>

    <section class="band band--limestone" id="join" aria-labelledby="join-heading">
      <div class="wrap join-partner-grid">
        <div class="join-column" data-reveal="up">
          <h2 class="section-heading" id="join-heading">${esc(c.joinPartners.joinHeading)}</h2>
          <p class="section-intro">${esc(c.joinPartners.joinIntro)}</p>

          <ol class="join-steps">
            ${c.joinPartners.joinSteps
              .map(
                (step, idx) => `
              <li>
                <span class="step-num">${idx + 1}</span>
                <div>
                  <h3>${esc(step.title)}</h3>
                  <p>${esc(step.body)}</p>
                </div>
              </li>`,
              )
              .join('')}
          </ol>

          <div class="join-links">
            <a class="btn btn--primary btn--radiant" href="#contact">${esc(c.joinPartners.followLabel)}</a>
            <div class="photo-frame photo-frame--tall" data-reveal="curtain">
              <img
                src="/landing/img/photo-f134249116-500.jpg"
                width="500"
                height="893"
                alt="${esc(c.joinPartners.oasisColumnsAlt)}"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>

        <div class="partner-column" id="partners" data-reveal="up" style="--stagger-i:1">
          <h2 class="section-heading">${esc(c.joinPartners.partnerHeading)}</h2>
          <p class="section-intro">${esc(c.joinPartners.partnerIntro)}</p>

          <div class="partner-list">
            ${c.joinPartners.partners
              .map(
                (partner, idx) => `
              <article class="partner-row" data-reveal="up" style="--stagger-i:${idx}">
                <div class="partner-row__head">
                  <h3>${esc(partner.name)}</h3>
                  <span class="partner-kind">${esc(partner.kind)}</span>
                </div>
                <p>${esc(partner.scope)}</p>
              </article>`,
              )
              .join('')}
          </div>

          <div class="sponsor-callout" data-reveal="up">
            <p>${esc(c.joinPartners.sponsorNote)}</p>
            <div class="hero-cta-row">
              <a class="btn btn--primary" href="mailto:treasurer.nvmsa@gmail.com">${esc(c.joinPartners.sponsorEmailCta)}</a>
              <a class="btn btn--outline" href="https://wa.me/201027246280" target="_blank" rel="noopener noreferrer">${esc(c.joinPartners.sponsorWhatsappCta)}</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="band band--sandstone" id="faq" aria-labelledby="faq-heading">
      <div class="wrap">
        <div data-reveal="up">
          <h2 class="section-heading" id="faq-heading">${esc(c.faq.heading)}</h2>
          <p class="section-intro">${esc(c.faq.intro)}</p>
        </div>
        <div class="faq-grid">
          ${c.faq.items
            .map(
              (item, idx) => `
            <article class="faq-item" data-reveal="up" style="--stagger-i:${idx}">
              <h3>${esc(item.q)}</h3>
              <p>${esc(item.a)}</p>
            </article>`,
            )
            .join('')}
        </div>
      </div>
    </section>

    <section class="band band--limestone" id="contact" aria-labelledby="contact-heading">
      <div class="wrap contact-grid">
        <div class="contact-eb" data-reveal="up">
          <h2 class="section-heading" id="contact-heading">${esc(c.contact.heading)}</h2>
          <p class="section-intro">${esc(c.contact.intro)}</p>
          <h3 class="group-heading">${esc(c.contact.ebDirectHeading)}</h3>
          <div class="contact-cards">
            ${ebSeats
              .map(
                (seat, idx) => `
              <article class="contact-card" data-reveal="scale" data-spotlight style="--stagger-i:${idx}">
                <div class="contact-card__top">
                  <span class="eb-monogram eb-monogram--sm" aria-hidden="true">${esc(getInitials(seat.name))}</span>
                  <span class="seat-badge seat-badge--gold">${esc(seat.code)}</span>
                  <strong>${esc(seat.name ?? '')}</strong>
                </div>
                <p class="contact-role">${esc(seat.title)}</p>
                <p class="contact-email" dir="ltr">${esc(seat.email)}</p>
                ${seat.whatsapp ? `<p class="contact-phone" dir="ltr">${esc(seat.whatsapp)}</p>` : ''}
                <div class="action-row">
                  ${renderSeatActions(seat, c.team.copyEmailLabel, c.team.whatsappLabel, c.team.emailLabel)}
                </div>
              </article>`,
              )
              .join('')}
          </div>
        </div>

        <div class="contact-social" data-reveal="up" style="--stagger-i:2">
          <h3 class="group-heading">${esc(c.contact.socialHeading)}</h3>
          <p class="body-copy">${esc(c.contact.socialNote)}</p>
          <div class="social-list">
            ${c.contact.socialLinks
              .map(
                (soc) => `
              <a class="social-card" href="${esc(soc.href)}" target="_blank" rel="noopener noreferrer">
                <span class="social-card__name">${esc(soc.label)}</span>
                <span class="social-card__handle" dir="ltr">${esc(soc.handle)}</span>
              </a>`,
              )
              .join('')}
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="wrap footer-inner">
      <div class="footer-brand">
        <img
          src="/brand/nvmsa-horizontal.png"
          width="240"
          height="87"
          alt="NVMSA — New Valley Medical Students' Association"
          decoding="async"
        />
        <p class="footer-place">${esc(c.footer.placeLine)}</p>
      </div>

      <div class="footer-os-box">
        <p>${esc(c.footer.osPrompt)}</p>
        <a class="btn btn--primary" href="/nvmsaOs/calendar">${esc(c.footer.osLinkLabel)}</a>
      </div>
    </div>

    <div class="wrap footer-legal">
      <p>${esc(c.footer.copyright)}</p>
      <p class="footer-credits">${esc(c.footer.photoCredit)}</p>
    </div>
  </footer>

  <div class="copy-toast" id="copy-toast" role="status" aria-live="polite" data-prefix="${esc(c.toastCopied)}" hidden></div>
  <script type="module" src="/src/landing/main.ts"></script>
</body>
</html>
`;
}
