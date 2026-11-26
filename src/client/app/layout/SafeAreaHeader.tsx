import { lazy, Suspense, useState } from 'react';
import { LogIn, UserCheck } from 'lucide-react';
import { useSession } from '../../core/auth/useSession';
import { Button } from '../../ui/Button';

const LazySignInSheet = lazy(() =>
  import('../../core/auth/SignInSheet').then((mod) => ({ default: mod.SignInSheet })),
);

interface SafeAreaHeaderProps {
  title: string;
  subtitle?: string;
}

export function SafeAreaHeader({ title, subtitle }: SafeAreaHeaderProps) {
  const { user } = useSession();
  const [authSheetOpen, setAuthSheetOpen] = useState(false);

  const badgeText =
    user?.tier === 'super_admin' ? 'System' : user?.seatCode ?? '';

  return (
    <>
      <header className="safe-top sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-brand font-display text-[14px] font-bold tracking-[-0.02em] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_6px_16px_-8px_rgb(15_118_110/0.7)]"
            >
              NV
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-display text-[17px] font-medium leading-tight tracking-[-0.015em] text-ink">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 truncate text-[13px] leading-tight text-muted">{subtitle}</p>
              )}
            </div>
          </div>

          <Button
            variant={user ? 'secondary' : 'primary'}
            size="sm"
            className="shrink-0"
            onClick={() => setAuthSheetOpen(true)}
          >
            {user ? (
              <>
                <UserCheck className="h-4 w-4" />
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
      </header>

      {authSheetOpen && (
        <Suspense fallback={null}>
          <LazySignInSheet open={authSheetOpen} onClose={() => setAuthSheetOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
