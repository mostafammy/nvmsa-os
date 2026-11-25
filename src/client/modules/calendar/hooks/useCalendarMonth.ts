import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ManagedSlotView, PublicSlotView } from '@shared/types';
import {
  buildMonthGrid,
  formatMonthHeading,
  getCurrentCairoMonth,
  getTodayCairoDate,
  shiftYearMonth,
} from '@shared/utils';
import {
  calendarKeys,
  fetchCalendarMonth,
  getCachedCalendarMonth,
} from '../api/calendar.queries';

export type CalendarSlotView = PublicSlotView | ManagedSlotView;

export function useCalendarMonth() {
  const todayCairo = useMemo(() => getTodayCairoDate(), []);
  const [month, setMonth] = useState<string>(() => getCurrentCairoMonth());

  const query = useQuery({
    queryKey: calendarKeys.month(month),
    queryFn: () => fetchCalendarMonth(month),
    initialData: () => getCachedCalendarMonth(month),
  });

  const gridCells = useMemo(() => buildMonthGrid(month), [month]);

  const slotsByDate = useMemo(() => {
    const map = new Map<string, CalendarSlotView>();
    for (const slot of query.data?.slots ?? []) {
      map.set(slot.postDate, slot);
    }
    return map;
  }, [query.data?.slots]);

  return {
    month,
    monthHeading: formatMonthHeading(month),
    todayCairo,
    gridCells,
    slotsByDate,
    relocationQueue: query.data?.relocationQueue ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    goToPrevMonth: () => setMonth((prev) => shiftYearMonth(prev, -1)),
    goToNextMonth: () => setMonth((prev) => shiftYearMonth(prev, 1)),
    goToToday: () => setMonth(getCurrentCairoMonth()),
  };
}
