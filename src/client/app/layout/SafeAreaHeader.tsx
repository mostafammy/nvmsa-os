import { ROLE_LABELS, type UserRole } from '@shared/constants';
import { useSession } from '../../core/auth/useSession';
import { Badge } from '../../ui/Badge';

interface SafeAreaHeaderProps {
  title: string;
  subtitle?: string;
}

export function SafeAreaHeader({ title, subtitle }: SafeAreaHeaderProps) {
  const { user, switchDevPersona } = useSession();
  const role: UserRole = user?.role ?? 'officer';

  return (
    <header className="safe-top sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-[11px] font-extrabold text-white">
              NV
            </span>
            <h1 className="truncate text-base font-bold text-slate-900">{title}</h1>
          </div>
          {subtitle && <p className="truncate text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {import.meta.env.DEV ? (
            <select
              aria-label="Switch development role"
              value={role}
              onChange={(event) => {
                const nextRole = event.target.value as UserRole;
                if (nextRole === 'officer') {
                  void switchDevPersona(null);
                  return;
                }
                void switchDevPersona({
                  role: nextRole,
                  userId: `dev-${nextRole}`,
                  userName: nextRole === 'admin' ? 'PNSDD Admin' : 'SCOPH EB Member',
                  entityCode: nextRole === 'admin' ? 'PNSDD' : 'SCOPH',
                });
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700"
            >
              <option value="officer">Dev: Officer</option>
              <option value="eb">Dev: EB Member</option>
              <option value="admin">Dev: Admin</option>
            </select>
          ) : (
            <Badge className="bg-teal-50 text-teal-800 border-teal-200">
              {ROLE_LABELS[role]}
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}
