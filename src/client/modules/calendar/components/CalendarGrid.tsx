import { useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { OrgUnit, SeatSessionUser } from '@shared/types';
import type { CalendarGridCell } from '@shared/utils';
import { Button } from '../../../ui/Button';
import type { CalendarSlotView } from '../hooks/useCalendarMonth';
import { DayCell } from './DayCell';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const SWIPE_MIN_PX = 52;

interface CalendarGridProps {
  monthHeading: string;
  todayCairo: string;
  cells: CalendarGridCell[];
  slotsByDate: Map<string, CalendarSlotView>;
  orgUnitsById: Map<string, OrgUnit>;
  activeFilterUnit: string | 'ALL';
  isPlacementMode: boolean;
  viewer: SeatSessionUser | null;
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
  orgUnitsById,
  activeFilterUnit,
  isPlacementMode,
  viewer,
  isFetching,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSelectDate,
}: CalendarGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleTouchStart = (event: ReactTouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: ReactTouchEvent<HTMLElement>) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;
    if (!start || !touch) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy) * 1.2) {
      return;
    }

    if (dx > 0) {
      onPrevMonth();
    } else {
      onNextMonth();
    }
  };

  const handleFocusMove = (currentIndex: number, key: string) => {
    let delta = 0;
    if (key === 'ArrowRight') delta = 1;
    else if (key === 'ArrowLeft') delta = -1;
    else if (key === 'ArrowDown') delta = 7;
    else if (key === 'ArrowUp') delta = -7;
    else return;

    const nextIdx = Math.max(0, Math.min(cells.length - 1, currentIndex + delta));
    setFocusedIndex(nextIdx);
    const targetCell = cells[nextIdx];
    if (!targetCell || !gridRef.current) return;
    const targetButton = gridRef.current.querySelector<HTMLButtonElement>(
      `button[data-iso-date="${targetCell.isoDate}"]`,
    );
    targetButton?.focus();
  };

  return (
    <section
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs sm:p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" size="sm" onClick={onPrevMonth} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={onNextMonth} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 aria-live="polite" className="ms-1 text-sm font-bold text-slate-900 sm:text-base">
            {monthHeading}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {isFetching && <span className="text-[11px] font-semibold text-teal-700">Syncing...</span>}
          <Button variant="ghost" size="sm" onClick={onToday}>
            Today
          </Button>
        </div>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-[11px] font-semibold uppercase tracking-wider text-slate-600"
          >
            {day}
          </div>
        ))}
      </div>

      <div ref={gridRef} className="grid grid-cols-7 grid-rows-6 gap-1 sm:gap-1.5">
        {cells.map((cell, index) => {
          const slot = slotsByDate.get(cell.isoDate);
          const orgUnit = slot ? orgUnitsById.get(slot.orgUnitId) : undefined;
          const isFilteredOut =
            Boolean(slot) && activeFilterUnit !== 'ALL' && slot?.orgUnitId !== activeFilterUnit;

          return (
            <DayCell
              key={cell.isoDate}
              cell={cell}
              slot={slot}
              orgUnit={orgUnit}
              isToday={cell.isoDate === todayCairo}
              isPast={cell.isoDate < todayCairo}
              isFilteredOut={isFilteredOut}
              isPlacementMode={isPlacementMode}
              viewer={viewer}
              tabIndex={index === focusedIndex ? 0 : -1}
              onSelect={onSelectDate}
              onFocusMove={(_iso, key) => handleFocusMove(index, key)}
            />
          );
        })}
      </div>
    </section>
  );
}
