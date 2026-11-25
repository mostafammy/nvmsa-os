import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { CalendarDays, Sparkles, Users, type LucideIcon } from 'lucide-react';

export interface OsModuleDefinition {
  id: string;
  name: string;
  shortLabel: string;
  route: string;
  icon: LucideIcon;
  status: 'active' | 'planned';
  description: string;
  component?: LazyExoticComponent<ComponentType>;
}

const LazyCalendarPage = lazy(() =>
  import('../modules/calendar').then((mod) => ({ default: mod.CalendarPage })),
);

/**
 * Central OS module registry (Open/Closed Principle):
 * Plugging in Module 2+ adds one entry here without touching existing modules.
 */
export const OS_MODULES: readonly OsModuleDefinition[] = [
  {
    id: 'calendar',
    name: 'Content Calendar',
    shortLabel: 'Calendar',
    route: '/calendar',
    icon: CalendarDays,
    status: 'active',
    description: '1-post-per-day locker, creator-locked editing, and relocation queue.',
    component: LazyCalendarPage,
  },
  {
    id: 'activities',
    name: 'Activities & Events',
    shortLabel: 'Activities',
    route: '/activities',
    icon: Sparkles,
    status: 'planned',
    description: 'Activity proposals, enrollment tracking, and impact reports (v1.x).',
  },
  {
    id: 'recruitment',
    name: 'Member Hub',
    shortLabel: 'Members',
    route: '/members',
    icon: Users,
    status: 'planned',
    description: 'Committee recruitment, member directory, and handover logs (v2.0).',
  },
];
