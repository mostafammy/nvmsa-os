import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { CalendarDays, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { SeatCapabilities } from '@shared/constants';

export interface OsModuleDefinition {
  id: string;
  name: string;
  shortLabel: string;
  route: string;
  icon: LucideIcon;
  description: string;
  requiredCapability?: keyof SeatCapabilities;
  component: LazyExoticComponent<ComponentType>;
}

const LazyCalendarPage = lazy(() =>
  import('../modules/calendar').then((mod) => ({ default: mod.CalendarPage })),
);

const LazyAdminPage = lazy(() =>
  import('../modules/admin').then((mod) => ({ default: mod.AdminPage })),
);

/**
 * Central OS module registry (Open/Closed Principle).
 * v1.0 mounts Module 1 (Content Calendar) plus capability-gated /admin seat governance.
 */
export const OS_MODULES: readonly OsModuleDefinition[] = [
  {
    id: 'calendar',
    name: 'Content Calendar',
    shortLabel: 'Calendar',
    route: '/calendar',
    icon: CalendarDays,
    description: '1-post-per-Cairo-day ledger, seat-locked editing, and relocation queue.',
    component: LazyCalendarPage,
  },
  {
    id: 'admin',
    name: 'Seat & Unit Governance',
    shortLabel: 'Admin',
    route: '/admin',
    icon: ShieldCheck,
    description: 'Manage the 13 official NVMSA leadership seats and organization units.',
    requiredCapability: 'canManageSeats',
    component: LazyAdminPage,
  },
];
