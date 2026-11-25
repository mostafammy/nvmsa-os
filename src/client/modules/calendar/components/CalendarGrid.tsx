import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarGridCell } from '@shared/utils';
import { Button } from '../../../ui/Button';
import type { CalendarSlotView } from '../hooks/useCalendarMonth';
import { DayCell } from './DayCell';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

interface CalendarGridProps {
  monthHeading: string;
  todayCairo: string;
  cells: CalendarGridCell[];
  slotsByDate: Map<string, CalendarSlotView>;
  isFetching: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectDate: (isoDate: string) => void;
}

export function CalendarGrid({
  monthHeading,
  todayCairo,
  cells,
  slotsByDate,
  isFetching,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSelectDate,
}: CalendarGridProps) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" size="sm" onClick={onPrevMonth} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={onNextMonth} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="ml-1 text-sm font-bold text-slate-900 sm:text-base">{monthHeading}</h2>
        </div>

        <div className="flex items-center gap-2">
          {isFetching && <span className="text-[11px] font-medium text-teal-600">Syncing...</span>}
          <Button variant="ghost" size="sm" onClick={onToday}>
            Today
          </Button>
        </div>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {cells.map((cell) => (
          <DayCell
            key={cell.isoDate}
            cell={cell}
            slot={slotsByDate.get(cell.isoDate)}
            isToday={cell.isoDate === todayCairo}
            onSelect={onSelectDate}
          />
        ))}
      </div>
    </section>
  );
}
