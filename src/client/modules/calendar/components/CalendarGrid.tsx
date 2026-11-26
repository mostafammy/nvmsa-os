import { useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
import { AnimatePresence, LazyMotion, MotionConfig, m } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { OrgUnit, SeatSessionUser } from '@shared/types';
import type { CalendarGridCell } from '@shared/utils';
import { MOTION_SPRINGS } from '../../../core/motion/tokens';
import { Button } from '../../../ui/Button';
import type { CalendarSlotView } from '../hooks/useCalendarMonth';
import { DayCell } from './DayCell';

const loadDomAnimation = () =>
  import('../../../core/motion/domAnimation').then((mod) => mod.default);

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

// The month slides in from the side it was asked for: next from the right, previous from the left.
const monthVariants = {
  enter: (dir: number) => ({ x: dir === 0 ? 0 : dir * 48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir === 0 ? 0 : dir * -48, opacity: 0 }),
};

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

  const monthKey = cells[10]?.isoDate.slice(0, 7) ?? '';
  const [prevMonthKey, setPrevMonthKey] = useState(monthKey);
  const [direction, setDirection] = useState(0);
  if (monthKey !== prevMonthKey) {
    setDirection(monthKey > prevMonthKey ? 1 : -1);
    setPrevMonthKey(monthKey);
  }

  const splitAt = monthHeading.lastIndexOf(' ');
  const monthName = splitAt > 0 ? monthHeading.slice(0, splitAt) : monthHeading;
  const monthYear = splitAt > 0 ? monthHeading.slice(splitAt + 1) : '';
  const showingCurrentMonth = monthKey === todayCairo.slice(0, 7);

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
      className="panel p-3 sm:p-5"
    >
      <div className="mb-4 flex items-end justify-between gap-3 px-1 sm:mb-5">
        <div className="min-w-0">
          <h2
            data-month-heading
            aria-live="polite"
            className="flex items-baseline gap-2 font-display text-[30px] font-normal leading-none tracking-[-0.035em] text-ink sm:text-[40px]"
          >
            <span className="truncate">{monthName}</span>{' '}
            <span className="font-mono text-[15px] tracking-normal text-muted sm:text-[17px]">
              {monthYear}
            </span>
          </h2>
          <p className="mt-1.5 flex min-h-5 items-center gap-1.5 text-[13px] text-muted">
            {isFetching ? (
              <>
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-brand" />
                Syncing
              </>
            ) : (
              <>Swipe or use arrows to switch month</>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {!showingCurrentMonth && (
            <Button variant="ghost" size="sm" onClick={onToday}>
              Today
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="w-11 !px-0"
            onClick={onPrevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-11 !px-0"
            onClick={onNextMonth}
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center sm:gap-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-[13px] font-medium text-muted">
            {day}
          </div>
        ))}
      </div>

      <div className="relative -m-1 overflow-hidden p-1">
        <LazyMotion features={loadDomAnimation} strict>
          <MotionConfig reducedMotion="user">
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
              <m.div
                key={monthKey}
                ref={gridRef}
                custom={direction}
                variants={monthVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={MOTION_SPRINGS.swipe}
                className="grid grid-cols-7 grid-rows-6 gap-1 sm:gap-2"
              >
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
              </m.div>
            </AnimatePresence>
          </MotionConfig>
        </LazyMotion>
      </div>
    </section>
  );
}
