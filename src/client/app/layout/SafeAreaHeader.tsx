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
      <header className="safe-top sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-[11px] font-extrabold text-white">
                NV
              </span>
              <h1 className="truncate text-base font-bold text-slate-900">{title}</h1>
            </div>
            {subtitle && <p className="mt-0.5 truncate text-xs text-slate-600">{subtitle}</p>}
          </div>

          <Button
            variant={user ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => setAuthSheetOpen(true)}
          >
            {user ? (
              <>
                <UserCheck className="h-3.5 w-3.5" />
                <span>{badgeText}</span>
              </>
            ) : (
              <>
                <LogIn className="h-3.5 w-3.5" />
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
