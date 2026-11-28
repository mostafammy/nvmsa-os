const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initLanguageHashSync(): void {
  const switches = document.querySelectorAll<HTMLAnchorElement>('[data-lang-switch]');
  switches.forEach((link) => {
    link.addEventListener('click', () => {
      const base = link.getAttribute('href');
      if (base && window.location.hash) {
        link.setAttribute('href', `${base.split('#')[0] ?? base}${window.location.hash}`);
      }
    });
  });
}

function initScrollEffects(): void {
  const progressBar = document.getElementById('scroll-progress');
  const parallaxFrames = document.querySelectorAll<HTMLElement>('[data-parallax]');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = prefersReducedMotion();

  let rafPending = false;
  const update = () => {
    rafPending = false;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    if (progressBar) {
      progressBar.style.setProperty('--scroll-progress', ratio.toFixed(4));
    }
    if (finePointer && !reduced) {
      const vh = window.innerHeight || 900;
      parallaxFrames.forEach((el) => {
        const range = Number(el.dataset.parallax ?? 0);
        const rect = el.getBoundingClientRect();
        const centerOffset = (rect.top + rect.height / 2 - vh / 2) / vh;
        const shift = Math.max(-range, Math.min(range, centerOffset * range * -1.4));
        el.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
      });
    }
  };

  const onScroll = () => {
    if (!rafPending) {
      rafPending = true;
      window.requestAnimationFrame(update);
    }
  };

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function animateCount(el: HTMLElement): void {
  if (el.dataset.counted === '1') return;
  el.dataset.counted = '1';
  const target = Number(el.dataset.countTo ?? 0);
  const suffix = el.dataset.countSuffix ?? '';
  if (!Number.isFinite(target) || prefersReducedMotion()) return;

  const hasComma = target >= 1000;
  const start = performance.now();
  const duration = target > 1000 ? 780 : 580;

  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const current = Math.round(target * eased);
    el.textContent = `${hasComma ? current.toLocaleString('en-US') : String(current)}${suffix}`;
    if (t < 1) {
      window.requestAnimationFrame(step);
    } else {
      el.textContent = `${hasComma ? target.toLocaleString('en-US') : String(target)}${suffix}`;
    }
  };
  window.requestAnimationFrame(step);
}

function initRevealsAndCounts(): void {
  const revealNodes = document.querySelectorAll<HTMLElement>('[data-reveal]');
  const heroCounts = document.querySelectorAll<HTMLElement>('.hero-fact [data-count-to]');
  heroCounts.forEach((el) => animateCount(el));

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    revealNodes.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        el.classList.add('is-visible');
        el.querySelectorAll<HTMLElement>('[data-count-to]').forEach((counter) =>
          animateCount(counter),
        );
        observer.unobserve(el);
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -4% 0px' },
  );

  revealNodes.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.96) {
      el.classList.add('is-visible');
      el.querySelectorAll<HTMLElement>('[data-count-to]').forEach((counter) =>
        animateCount(counter),
      );
    } else {
      observer.observe(el);
    }
  });
}

function initSpotlightCards(): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches || prefersReducedMotion()) {
    return;
  }
  document.addEventListener(
    'pointermove',
    (event) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-spotlight]');
      if (!target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty('--mx', `${Math.round(event.clientX - rect.left)}px`);
      target.style.setProperty('--my', `${Math.round(event.clientY - rect.top)}px`);
    },
    { passive: true },
  );
}

function initMobileDrawer(): void {
  const toggle = document.getElementById('menu-toggle');
  const drawer = document.getElementById('mobile-drawer');
  const closeBtn = document.getElementById('menu-close');
  if (!toggle || !drawer || !closeBtn) return;

  const setOpen = (open: boolean) => {
    drawer.hidden = !open;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      closeBtn.focus();
    } else {
      toggle.focus();
    }
  };

  toggle.addEventListener('click', () => setOpen(true));
  closeBtn.addEventListener('click', () => setOpen(false));
  drawer.addEventListener('click', (event) => {
    if (event.target === drawer) setOpen(false);
  });
  drawer.querySelectorAll('a').forEach((anchor) => {
    anchor.addEventListener('click', () => {
      drawer.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !drawer.hidden) {
      setOpen(false);
    }
  });
}

function initTeamFilter(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-team-filter]');
  const groups = document.querySelectorAll<HTMLElement>('[data-team-group]');
  if (!buttons.length || !groups.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.teamFilter ?? 'all';
      buttons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      groups.forEach((group) => {
        const organ = group.dataset.teamGroup;
        group.hidden = filter !== 'all' && organ !== filter;
      });
    });
  });

  const sampleToggle = document.getElementById('sample-toggle') as HTMLButtonElement | null;
  const samplePanel = document.getElementById('sample-panel');
  if (sampleToggle && samplePanel) {
    sampleToggle.addEventListener('click', () => {
      const willOpen = samplePanel.hidden;
      samplePanel.hidden = !willOpen;
      sampleToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      sampleToggle.textContent = willOpen
        ? (sampleToggle.dataset.labelOpen ?? sampleToggle.textContent)
        : (sampleToggle.dataset.labelClosed ?? sampleToggle.textContent);
    });
  }
}

function initImpactLens(): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>('[data-impact-lens]');
  const rows = document.querySelectorAll<HTMLElement>('#impact-bars .bar-row');
  if (!tabs.length || !rows.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const lens = tab.dataset.impactLens ?? 'online';
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      let maxVal = 1;
      const values: number[] = [];
      rows.forEach((row) => {
        const num = Number(row.dataset[lens] ?? 0);
        values.push(num);
        if (num > maxVal) maxVal = num;
      });

      rows.forEach((row, index) => {
        const val = values[index] ?? 0;
        const fill = row.querySelector<HTMLElement>('.bar-fill');
        const label = row.querySelector<HTMLElement>('[data-bar-value]');
        if (fill) {
          fill.style.setProperty('--ratio', (val / maxVal).toFixed(4));
        }
        if (label) {
          label.textContent =
            lens === 'online' ? (row.dataset.onlineDisplay ?? String(val)) : String(val);
        }
      });
    });
  });
}

function initTabGroup(tabAttr: string, panelAttr: string): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>(`[${tabAttr}]`);
  const panels = document.querySelectorAll<HTMLElement>(`[${panelAttr}]`);
  if (!tabs.length || !panels.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute(tabAttr);
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      panels.forEach((panel) => {
        const match = panel.getAttribute(panelAttr) === targetId;
        panel.hidden = !match;
        panel.classList.toggle('is-active', match);
      });
    });
  });
}

function initCopyEmails(): void {
  const toast = document.getElementById('copy-toast');
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-copy-email]');
  if (!buttons.length) return;

  let timer: number | undefined;
  buttons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const email = btn.dataset.copyEmail;
      if (!email) return;
      try {
        await navigator.clipboard.writeText(email);
      } catch {
        // Clipboard permission can be unavailable in restricted contexts.
      }
      if (toast) {
        const prefix = toast.dataset.prefix ?? 'Copied:';
        toast.textContent = `${prefix} ${email}`;
        toast.hidden = false;
        if (timer !== undefined) window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          toast.hidden = true;
        }, 2600);
      }
    });
  });
}

function boot(): void {
  document.documentElement.classList.add('nv-ready');
  initLanguageHashSync();
  initScrollEffects();
  initRevealsAndCounts();
  initSpotlightCards();
  initMobileDrawer();
  initTeamFilter();
  initImpactLens();
  initTabGroup('data-unit-tab', 'data-unit-panel');
  initTabGroup('data-term-tab', 'data-term-panel');
  initCopyEmails();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
