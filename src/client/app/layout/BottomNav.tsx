import { NavLink } from 'react-router-dom';
import { OS_MODULES } from '../modules.registry';

export function BottomNav() {
  return (
    <nav
      aria-label="NVMSA OS Modules"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-3">
        {OS_MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <NavLink
              key={mod.id}
              to={mod.route}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
                  isActive ? 'text-teal-700' : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{mod.shortLabel}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
