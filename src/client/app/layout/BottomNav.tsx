import { NavLink, useLocation } from 'react-router-dom';
import { useSession } from '../../core/auth/useSession';
import { OS_MODULES } from '../modules.registry';

export function BottomNav() {
  const { user } = useSession();
  const { pathname } = useLocation();
  const visibleModules = OS_MODULES.filter(
    (mod) => !mod.requiredCapability || Boolean(user?.capabilities[mod.requiredCapability]),
  );

  if (visibleModules.length <= 1) {
    return null;
  }

  const activeIndex = Math.max(
    0,
    visibleModules.findIndex((mod) => pathname.startsWith(mod.route)),
  );

  return (
    <nav
      aria-label="NVMSA OS Modules"
      className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-3"
    >
      <div
        className="pointer-events-auto relative mx-auto grid max-w-xs rounded-full border border-line bg-surface/90 p-1.5 shadow-[0_12px_32px_-16px_rgb(20_32_30/0.45)] backdrop-blur-xl"
        style={{ gridTemplateColumns: `repeat(${visibleModules.length}, minmax(0, 1fr))` }}
      >
        {/* One indicator slides between tabs by transform alone. */}
        <span
          aria-hidden="true"
          className="absolute inset-y-1.5 start-1.5 rounded-full bg-ink transition-transform duration-[240ms] ease-[var(--ease-enter)]"
          style={{
            width: `calc((100% - 0.75rem) / ${visibleModules.length})`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
        {visibleModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <NavLink
              key={mod.id}
              to={mod.route}
              className={({ isActive }) =>
                `relative z-10 flex min-h-11 items-center justify-center gap-2 rounded-full text-[13px] font-medium transition-colors duration-200 active:scale-[0.97] ${
                  isActive ? 'text-paper' : 'text-ink-soft hover:text-ink'
                }`
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              <span>{mod.shortLabel}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
