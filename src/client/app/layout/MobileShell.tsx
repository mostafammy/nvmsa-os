import { Outlet, useLocation } from 'react-router-dom';
import { OS_MODULES } from '../modules.registry';
import { BottomNav } from './BottomNav';
import { SafeAreaHeader } from './SafeAreaHeader';

export function MobileShell() {
  const { pathname } = useLocation();
  const activeModule =
    OS_MODULES.find((mod) => pathname.startsWith(mod.route)) ?? OS_MODULES[0];

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <SafeAreaHeader
        title={activeModule?.name ?? 'NVMSA OS'}
        subtitle={activeModule?.description}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5 sm:px-6 sm:pt-8">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
