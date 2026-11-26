import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CANONICAL_ORG_UNITS } from '@shared/constants';
import type { ManagedSlotView, OrgUnit, PublicSlotView } from '@shared/types';
import {
  buildMonthGrid,
  formatMonthHeading,
  getCurrentCairoMonth,
  shiftYearMonth,
} from '@shared/utils';
import { useSession } from '../../../core/auth/useSession';
import {
  calendarKeys,
  fetchCalendarMonth,
  fetchRelocationQueue,
  getCachedCalendarMonth,
} from '../api/calendar.queries';
import { useCairoClock } from './useCairoClock';

export type CalendarSlotView = PublicSlotView | ManagedSlotView;

export const CALENDAR_BROADCAST_CHANNEL = 'nvmsa-calendar';

const FALLBACK_ORG_UNITS: OrgUnit[] = CANONICAL_ORG_UNITS.map((unit) => ({
  id: unit.code,
  code: unit.code,
  name: unit.name,
  kind: unit.kind,
  accentToken: unit.accentToken,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}));

export function useCalendarMonth() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const cacheScope = user ? user.id : 'public';
  const [month, setMonth] = useState<string>(() => getCurrentCairoMonth());
  const cachedEnvelope = getCachedCalendarMonth(month, cacheScope);

  const query = useQuery({
    queryKey: calendarKeys.month(cacheScope, month),
    queryFn: () => fetchCalendarMonth(month, cacheScope),
    initialData: () => cachedEnvelope?.data,
    initialDataUpdatedAt: cachedEnvelope?.updatedAt,
  });

  const relocationsQuery = useQuery({
    queryKey: calendarKeys.relocations(cacheScope),
    queryFn: fetchRelocationQueue,
    enabled: user !== null,
  });

  const todayCairo = useCairoClock(query.data?.serverTodayCairo);
  const gridCells = useMemo(() => buildMonthGrid(month), [month]);

  useEffect(() => {
    const prevMonth = shiftYearMonth(month, -1);
    const nextMonth = shiftYearMonth(month, 1);

    const timer = window.setTimeout(() => {
      void queryClient.prefetchQuery({
        queryKey: calendarKeys.month(cacheScope, prevMonth),
        queryFn: () => fetchCalendarMonth(prevMonth, cacheScope),
      });
      void queryClient.prefetchQuery({
        queryKey: calendarKeys.month(cacheScope, nextMonth),
        queryFn: () => fetchCalendarMonth(nextMonth, cacheScope),
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [cacheScope, month, queryClient]);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(CALENDAR_BROADCAST_CHANNEL);
    channel.onmessage = (event) => {
      const payload = event.data as { type?: string; months?: string[] };
      if (payload.type === 'invalidate') {
        for (const targetMonth of payload.months ?? []) {
          void queryClient.invalidateQueries({
            queryKey: calendarKeys.month(cacheScope, targetMonth),
          });
        }
        if (user) {
          void queryClient.invalidateQueries({
            queryKey: calendarKeys.relocations(cacheScope),
          });
        }
      }
    };
    return () => channel.close();
  }, [cacheScope, queryClient, user]);

  const orgUnits = query.data?.orgUnits ?? FALLBACK_ORG_UNITS;

  const orgUnitsById = useMemo(
    () => new Map(orgUnits.map((unit) => [unit.id, unit])),
    [orgUnits],
  );

  const slotsByDate = useMemo(() => {
    const map = new Map<string, CalendarSlotView>();
    for (const slot of query.data?.slots ?? []) {
      if (slot.postDate) {
        map.set(slot.postDate, slot);
      }
    }
    return map;
  }, [query.data?.slots]);

  return {
    month,
    monthHeading: formatMonthHeading(month),
    todayCairo,
    cacheScope,
    gridCells,
    orgUnits,
    orgUnitsById,
    slotsByDate,
    relocationQueue: relocationsQuery.data?.items ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    setMonth,
    goToPrevMonth: () => setMonth((prev) => shiftYearMonth(prev, -1)),
    goToNextMonth: () => setMonth((prev) => shiftYearMonth(prev, 1)),
    goToToday: () => setMonth(getCurrentCairoMonth()),
  };
}
