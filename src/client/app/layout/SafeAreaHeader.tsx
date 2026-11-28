import { lazy, Suspense, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LogIn, UserCheck } from 'lucide-react';
import { useSession } from '../../core/auth/useSession';
import { Button } from '../../ui/Button';
import { OS_MODULES } from '../modules.registry';

const LazySignInSheet = lazy(() =>
  import('../../core/auth/SignInSheet').then((mod) => ({ default: mod.SignInSheet })),
);

const CAIRO_HH_MM = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Cairo',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatCairoClock(): string {
  return CAIRO_HH_MM.format(new Date());
}

interface SafeAreaHeaderProps {
  title: string;
  subtitle?: string;
}

export function SafeAreaHeader({ title, subtitle }: SafeAreaHeaderProps) {
  const { user } = useSession();
  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [cairoTime, setCairoTime] = useState<string>(() => formatCairoClock());

  useEffect(() => {
    const id = window.setInterval(() => setCairoTime(formatCairoClock()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const visibleModules = OS_MODULES.filter(
    (mod) => !mod.requiredCapability || Boolean(user?.capabilities[mod.requiredCapability]),
  );

  const badgeText =
    user?.tier === 'super_admin' ? 'System' : user?.seatCode ?? '';

  return (
    <>
      <header className="safe-top sticky top-0 z-30 border-b border-line bg-paper/75 backdrop-blur-2xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3.5">
            <a
              href="/"
              title="Back to NVMSA public home"
              className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[13px] border border-brand-glow/45 bg-[#faf4e8] p-1 shadow-[0_0_24px_-6px_rgb(229_162_36/0.55)] transition-transform duration-150 hover:scale-[1.03]"
            >
              <img
                src="/brand/nvmsa-emblem.png"
                alt="NVMSA Hibis Temple"
                className="h-full w-full object-contain"
              />
            </a>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-[17px] font-medium leading-tight tracking-[-0.015em] text-ink">
                  {title}
                </h1>
                <span className="hidden rounded-full border border-brand-glow/30 bg-brand-soft px-2 py-0.5 font-mono text-[12px] leading-none text-brand-text sm:inline-flex">
                  OS
                </span>
              </div>
              {subtitle && (
                <p className="mt-0.5 truncate text-[13px] leading-tight text-muted">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            {visibleModules.length > 1 && (
              <nav aria-label="Primary modules" className="hidden items-center gap-1 rounded-full border border-line bg-surface/80 p-1 lg:flex">
                {visibleModules.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <NavLink
                      key={mod.id}
                      to={mod.route}
                      className={({ isActive }) =>
                        `inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors duration-150 ${
                          isActive
                            ? 'bg-brand text-brand-ink font-semibold shadow-[0_0_16px_-6px_rgb(229_162_36/0.65)]'
                            : 'text-ink-soft hover:bg-white/[0.06] hover:text-ink'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4" />
                      <span>{mod.shortLabel}</span>
                    </NavLink>
                  );
                })}
              </nav>
            )}

            <div
              className="hidden items-center gap-2 rounded-full border border-line bg-surface/85 px-3.5 py-2 font-mono text-[13px] text-ink-soft sm:inline-flex"
              title="Cairo time (Africa/Cairo)"
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-brand-glow animate-[var(--animate-pulse-dot)]"
              />
              <span className="tabular-nums">{cairoTime}</span>
              <span className="text-muted">EET</span>
            </div>

            <Button
              variant={user ? 'secondary' : 'primary'}
              size="sm"
              className="shrink-0"
              onClick={() => setAuthSheetOpen(true)}
            >
              {user ? (
                <>
                  <UserCheck className="h-4 w-4 text-brand-text" />
                  <span className="font-mono">{badgeText}</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {authSheetOpen && (
        <Suspense fallback={null}>
          <LazySignInSheet open={authSheetOpen} onClose={() => setAuthSheetOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
