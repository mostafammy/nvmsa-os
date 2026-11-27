import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeftRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Clock,
  List,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import { resolveAccentPalette } from '@shared/constants';
import type { ManagedSlotView, OrgUnit } from '@shared/types';
import { formatShortDayLabel, getMonthDateBounds } from '@shared/utils';
import { ApiRequestError, createIdempotencyKey } from '../../../core/api/client';
import { RoleGate } from '../../../core/auth/RoleGate';
import { useSession } from '../../../core/auth/useSession';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { BookingSheet } from '../components/BookingSheet';
import { CalendarGrid } from '../components/CalendarGrid';
import { RelocationDrawer } from '../components/RelocationDrawer';
import { useCalendarMonth, type CalendarSlotView } from '../hooks/useCalendarMonth';
import { useOptimisticBooking } from '../hooks/useOptimisticBooking';

type CalendarUiState =
  | { kind: 'idle' }
  | { kind: 'inspectingOrBooking'; date: string }
  | { kind: 'relocationQueueOpen' }
  | { kind: 'placingRelocation'; slot: ManagedSlotView };

const CAIRO_CLOCK_FMT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Cairo',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function OccupancyRing({
  percent,
  value,
}: {
  percent: number;
  value: number;
}) {
  const radius = 19;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="rgb(255 255 255 / 0.1)"
          strokeWidth="3.5"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="#2dd4bf"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-700 ease-[var(--ease-enter)]"
        />
      </svg>
      <span className="absolute font-mono text-[13px] font-medium text-ink tabular-nums">
        {value}
      </span>
    </div>
  );
}

function TodaySpotlightCard({
  todayCairo,
  cairoTime,
  todaySlot,
  todayUnit,
  fillPercent,
  bookedCount,
  daysInMonth,
  onInspectToday,
  compact = false,
}: {
  todayCairo: string;
  cairoTime: string;
  todaySlot?: CalendarSlotView;
  todayUnit?: OrgUnit;
  fillPercent: number;
  bookedCount: number;
  daysInMonth: number;
  onInspectToday: () => void;
  compact?: boolean;
}) {
  const palette = resolveAccentPalette(todayUnit?.accentToken);
  const todayLabel = formatShortDayLabel(todayCairo);

  return (
    <section className="panel-glow p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-brand-glow animate-[var(--animate-pulse-dot)]"
            />
            <span className="font-mono text-[12px] font-medium text-brand-text">
              Today · {todayLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[13px] text-muted">
            <Clock className="h-3.5 w-3.5 text-brand-text" aria-hidden="true" />
            <span className="tabular-nums">{cairoTime} Cairo</span>
          </div>
        </div>

        {compact ? (
          <OccupancyRing percent={fillPercent} value={bookedCount} />
        ) : (
          <span className="rounded-full border border-brand-glow/30 bg-brand-soft px-2.5 py-1 font-mono text-[12px] text-brand-text">
            {bookedCount}/{daysInMonth} booked
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onInspectToday}
        className="lift press group mt-3.5 flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-start hover:border-brand-glow/45 hover:bg-black/40"
      >
        {todaySlot ? (
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <Badge className={palette.badgeClass}>{todaySlot.orgUnitId}</Badge>
              <span className="font-mono text-[12px] text-muted">
                {todaySlot.contentType.replace('_', ' ')}
              </span>
            </div>
            <p dir="auto" className="truncate text-[15px] font-medium text-ink">
              {todaySlot.title}
            </p>
          </div>
        ) : (
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-ink">Today&apos;s post slot is open</p>
            <p className="text-[13px] text-muted">Tap to inspect or book for Cairo today</p>
          </div>
        )}
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/25 text-brand-text transition-transform duration-150 group-hover:translate-x-0.5 group-hover:bg-brand group-hover:text-white">
          {todaySlot ? <ArrowUpRight className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </span>
      </button>
    </section>
  );
}

export function CalendarPage() {
  const { user } = useSession();
  const {
    month,
    monthHeading,
    todayCairo,
    cacheScope,
    gridCells,
    orgUnits,
    orgUnitsById,
    slotsByDate,
    relocationQueue,
    isFetching,
    error,
    setMonth,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
  } = useCalendarMonth();

  const {
    bookMutation,
    updateMutation,
    queueRelocationMutation,
    relocateMutation,
    overrideMutation,
    cancelMutation,
  } = useOptimisticBooking(cacheScope);

  const [uiState, setUiState] = useState<CalendarUiState>({ kind: 'idle' });
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');
  const [unitFilter, setUnitFilter] = useState<string | 'ALL'>('ALL');
  const [cairoTime, setCairoTime] = useState<string>(() => CAIRO_CLOCK_FMT.format(new Date()));

  useEffect(() => {
    const id = window.setInterval(() => setCairoTime(CAIRO_CLOCK_FMT.format(new Date())), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const isPlacementMode = uiState.kind === 'placingRelocation';
  const effectiveViewMode = isPlacementMode ? 'grid' : viewMode;

  useEffect(() => {
    if (!isPlacementMode) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUiState({ kind: 'idle' });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPlacementMode]);

  const monthScopedSlots = useMemo(() => {
    const items: CalendarSlotView[] = [];
    for (const slot of slotsByDate.values()) {
      if (slot.postDate?.startsWith(month)) {
        if (unitFilter === 'ALL' || slot.orgUnitId === unitFilter) {
          items.push(slot);
        }
      }
    }
    return items.sort((a, b) => (a.postDate ?? '').localeCompare(b.postDate ?? ''));
  }, [month, slotsByDate, unitFilter]);

  const unitCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const slot of slotsByDate.values()) {
      if (slot.postDate?.startsWith(month)) {
        counts.set(slot.orgUnitId, (counts.get(slot.orgUnitId) ?? 0) + 1);
      }
    }
    return counts;
  }, [month, slotsByDate]);

  const upcomingSlots = useMemo(
    () => monthScopedSlots.filter((s) => (s.postDate ?? '') >= todayCairo).slice(0, 4),
    [monthScopedSlots, todayCairo],
  );

  const nextOpenDates = useMemo(() => {
    const open: string[] = [];
    for (const cell of gridCells) {
      if (!cell.inCurrentMonth) continue;
      if (cell.isoDate < todayCairo) continue;
      if (slotsByDate.has(cell.isoDate)) continue;
      open.push(cell.isoDate);
      if (open.length >= 3) break;
    }
    return open;
  }, [gridCells, slotsByDate, todayCairo]);

  const daysInMonth = useMemo(() => {
    const { end } = getMonthDateBounds(month);
    return Number(end.slice(8, 10)) || 30;
  }, [month]);

  const fillPercent = Math.min(100, Math.round((monthScopedSlots.length / daysInMonth) * 100));
  const todaySlot = slotsByDate.get(todayCairo);
  const todayUnit = todaySlot ? orgUnitsById.get(todaySlot.orgUnitId) : undefined;

  const selectedDate = uiState.kind === 'inspectingOrBooking' ? uiState.date : null;
  const selectedSlot = selectedDate ? slotsByDate.get(selectedDate) : undefined;

  const isBusy =
    bookMutation.isPending ||
    updateMutation.isPending ||
    queueRelocationMutation.isPending ||
    relocateMutation.isPending ||
    overrideMutation.isPending ||
    cancelMutation.isPending;

  const handleSelectDate = async (isoDate: string) => {
    const tappedMonth = isoDate.slice(0, 7);
    if (tappedMonth !== month && uiState.kind !== 'placingRelocation') {
      setMonth(tappedMonth);
    }

    if (uiState.kind === 'placingRelocation') {
      if (slotsByDate.has(isoDate)) return;
      try {
        await relocateMutation.mutateAsync({
          id: uiState.slot.id,
          input: {
            expectedVersion: uiState.slot.version,
            targetDate: isoDate,
          },
          idempotencyKey: createIdempotencyKey(),
        });
        setMonth(tappedMonth);
        setUiState({ kind: 'idle' });
      } catch (err) {
        if (err instanceof ApiRequestError && (err.status === 412 || err.status === 404)) {
          setUiState({ kind: 'idle' });
        }
      }
      return;
    }

    setUiState({ kind: 'inspectingOrBooking', date: isoDate });
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px] lg:items-start lg:gap-6">
      {/* Left / Main Calendar Stage */}
      <div className="animate-enter min-w-0 space-y-4 sm:space-y-5">
        {uiState.kind === 'placingRelocation' && (
          <div
            role="status"
            className="sticky top-[72px] z-20 flex items-center justify-between gap-3 rounded-2xl border border-brand-glow/50 bg-[#0b2321]/95 px-4 py-3 text-ink shadow-[0_18px_40px_-14px_rgb(0_0_0/0.85)] backdrop-blur-xl"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 animate-[var(--animate-pulse-dot)] rounded-full bg-brand-glow"
              />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-brand-text">Placement mode active</p>
                <p dir="auto" className="truncate text-[13px] text-ink">
                  Tap any open day for: {uiState.slot.title}
                </p>
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setUiState({ kind: 'idle' })}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}

        {/* Mobile / Tablet Today Hero Spotlight */}
        <div className="lg:hidden">
          <TodaySpotlightCard
            todayCairo={todayCairo}
            cairoTime={cairoTime}
            todaySlot={todaySlot}
            todayUnit={todayUnit}
            fillPercent={fillPercent}
            bookedCount={monthScopedSlots.length}
            daysInMonth={daysInMonth}
            compact
            onInspectToday={() => void handleSelectDate(todayCairo)}
          />
        </div>

        {/* Command Strip */}
        <div className="panel flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="hidden min-w-0 items-center gap-3.5 lg:flex">
            <OccupancyRing percent={fillPercent} value={monthScopedSlots.length} />
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-ink">
                {unitFilter === 'ALL'
                  ? `${monthScopedSlots.length} of ${daysInMonth} days booked`
                  : `${monthScopedSlots.length} ${unitFilter} posts`}
              </p>
              <p className="text-[13px] text-muted">
                {fillPercent}% monthly capacity · {monthHeading}
              </p>
            </div>
          </div>

          <div
            role="group"
            aria-label="Calendar layout"
            className="relative inline-grid grid-cols-2 rounded-full border border-line bg-sunken p-1"
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-1 start-1 w-[calc(50%-0.25rem)] rounded-full bg-brand shadow-[0_0_18px_-6px_rgb(45_212_191/0.75)] transition-transform duration-[240ms] ease-[var(--ease-enter)]"
              style={{
                transform: effectiveViewMode === 'agenda' ? 'translateX(100%)' : 'translateX(0%)',
              }}
            />
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Month grid view"
              aria-pressed={effectiveViewMode === 'grid'}
              className={`relative z-10 inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors duration-150 ${
                effectiveViewMode === 'grid' ? 'text-white' : 'text-muted hover:text-ink'
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              disabled={isPlacementMode}
              onClick={() => setViewMode('agenda')}
              aria-label="Agenda list view"
              aria-pressed={effectiveViewMode === 'agenda'}
              className={`relative z-10 inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
                effectiveViewMode === 'agenda' ? 'text-white' : 'text-muted hover:text-ink'
              }`}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Agenda</span>
            </button>
          </div>

          <RoleGate
            fallback={
              <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-sunken/90 px-4 text-[13px] font-medium text-ink-soft">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand-glow" />
                Read-Only
              </span>
            }
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setUiState({ kind: 'relocationQueueOpen' })}
            >
              <ArrowLeftRight className="h-4 w-4 text-brand-text" />
              <span>Queue</span>
              <span className="font-mono text-[12px] text-brand-text">
                ({relocationQueue.length})
              </span>
            </Button>
          </RoleGate>
        </div>

        {/* Committee / division filter chips — every target >= 44px */}
        <div
          role="group"
          aria-label="Filter by committee or division"
          className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-0.5 sm:mx-0 sm:px-0"
        >
          <button
            type="button"
            data-unit-filter="ALL"
            aria-pressed={unitFilter === 'ALL'}
            onClick={() => setUnitFilter('ALL')}
            className={`press inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border px-4 text-[13px] font-medium ${
              unitFilter === 'ALL'
                ? 'border-brand-glow/55 bg-brand text-white shadow-[0_0_22px_-6px_rgb(45_212_191/0.75)]'
                : 'border-line bg-surface/90 text-ink-soft hover:border-line-strong hover:text-ink'
            }`}
          >
            All
          </button>
          {orgUnits.map((unit) => {
            const active = unitFilter === unit.id;
            const palette = resolveAccentPalette(unit.accentToken);
            return (
              <button
                key={unit.id}
                type="button"
                data-unit-filter={unit.id}
                aria-pressed={active}
                onClick={() => setUnitFilter(unit.id)}
                className={`press inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border px-3.5 text-[13px] font-medium ${
                  active
                    ? 'border-brand-glow/55 bg-brand text-white shadow-[0_0_22px_-6px_rgb(45_212_191/0.75)]'
                    : 'border-line bg-surface/90 text-ink-soft hover:border-line-strong hover:text-ink'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full ${active ? 'bg-white' : palette.dotClass}`}
                />
                <span>{unit.code}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-400/35 bg-red-500/15 px-4 py-3.5 text-[14px] text-red-100"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
            <p>{error instanceof Error ? error.message : 'Unable to reach calendar API'}</p>
          </div>
        )}

        {effectiveViewMode === 'grid' ? (
          <CalendarGrid
            monthHeading={monthHeading}
            todayCairo={todayCairo}
            cells={gridCells}
            slotsByDate={slotsByDate}
            orgUnitsById={orgUnitsById}
            activeFilterUnit={unitFilter}
            isPlacementMode={isPlacementMode}
            viewer={user}
            isFetching={isFetching}
            onPrevMonth={goToPrevMonth}
            onNextMonth={goToNextMonth}
            onToday={goToToday}
            onSelectDate={(isoDate) => void handleSelectDate(isoDate)}
          />
        ) : (
          <section className="panel p-4 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2
                  data-month-heading
                  className="font-display text-[24px] font-normal leading-tight tracking-[-0.03em] text-ink sm:text-[28px]"
                >
                  {monthHeading} — Agenda
                </h2>
                <p className="mt-1 text-[13px] text-muted">
                  Scheduled posts in Cairo date order
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={goToToday}>
                Today
              </Button>
            </div>

            {monthScopedSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-sunken/70 px-6 py-12 text-center">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-glow/25 bg-brand-soft text-brand-text">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <p className="text-[16px] font-medium text-ink">
                  No booked posts in {monthHeading}
                </p>
                <p className="mt-1 max-w-sm text-[14px] text-muted">
                  {unitFilter === 'ALL'
                    ? 'Every Cairo day in this month is currently open. Switch to Grid to inspect or book a date.'
                    : `No posts are booked for ${unitFilter} in ${monthHeading}.`}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {unitFilter !== 'ALL' && (
                    <Button variant="secondary" size="sm" onClick={() => setUnitFilter('ALL')}>
                      Show All Units
                    </Button>
                  )}
                  <Button variant="primary" size="sm" onClick={() => setViewMode('grid')}>
                    Open Month Grid
                  </Button>
                </div>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {monthScopedSlots.map((slot) => {
                  const palette = resolveAccentPalette(
                    orgUnitsById.get(slot.orgUnitId)?.accentToken,
                  );
                  const dayNumber = slot.postDate ? slot.postDate.slice(8, 10) : '--';
                  const dayLabel = slot.postDate ? formatShortDayLabel(slot.postDate) : 'Pending';
                  return (
                    <li key={slot.id}>
                      <button
                        type="button"
                        onClick={() =>
                          slot.postDate &&
                          setUiState({ kind: 'inspectingOrBooking', date: slot.postDate })
                        }
                        className="lift press group relative flex min-h-16 w-full cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-2xl border border-line bg-elevated/80 px-4 py-3 text-start hover:border-brand-glow/40"
                      >
                        <span
                          aria-hidden="true"
                          className={`absolute inset-y-0 start-0 w-1 ${palette.dotClass}`}
                        />
                        <div className="flex min-w-0 items-center gap-3.5 ps-1">
                          <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-line bg-sunken font-mono">
                            <span className="text-[15px] font-medium leading-none text-ink tabular-nums">
                              {dayNumber}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-mono text-[12px] text-brand-text">{dayLabel}</p>
                            <p dir="auto" className="truncate text-[15px] font-medium text-ink">
                              {slot.title}
                            </p>
                            <p className="text-[13px] text-muted">
                              {slot.contentType.replace('_', ' ')} · {slot.creatorName}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge className={palette.badgeClass}>{slot.orgUnitId}</Badge>
                          <ChevronRight className="h-4 w-4 text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-brand-text" />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </div>

      {/* Right Desktop Command Center Sidebar */}
      <aside className="animate-enter-delay hidden lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-5">
        <TodaySpotlightCard
          todayCairo={todayCairo}
          cairoTime={cairoTime}
          todaySlot={todaySlot}
          todayUnit={todayUnit}
          fillPercent={fillPercent}
          bookedCount={monthScopedSlots.length}
          daysInMonth={daysInMonth}
          onInspectToday={() => void handleSelectDate(todayCairo)}
        />

        {/* Up Next + Quick-Pick Open Days */}
        <section className="panel p-5">
          <div className="mb-3.5 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-[16px] font-medium text-ink">
              <Sparkles className="h-4 w-4 text-brand-text" aria-hidden="true" />
              <span>{upcomingSlots.length > 0 ? 'Up Next' : 'Next Open Cairo Days'}</span>
            </h3>
            <span className="font-mono text-[12px] text-muted">{monthHeading}</span>
          </div>

          {upcomingSlots.length > 0 ? (
            <ul className="space-y-2">
              {upcomingSlots.map((slot) => {
                const palette = resolveAccentPalette(
                  orgUnitsById.get(slot.orgUnitId)?.accentToken,
                );
                return (
                  <li key={slot.id}>
                    <button
                      type="button"
                      onClick={() =>
                        slot.postDate &&
                        setUiState({ kind: 'inspectingOrBooking', date: slot.postDate })
                      }
                      className="lift press flex min-h-12 w-full cursor-pointer items-center justify-between gap-2.5 rounded-xl border border-line bg-elevated/70 px-3 py-2.5 text-start hover:border-brand-glow/40"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-[12px] text-brand-text">
                          {slot.postDate ? formatShortDayLabel(slot.postDate) : 'Pending'}
                        </p>
                        <p dir="auto" className="truncate text-[14px] font-medium text-ink">
                          {slot.title}
                        </p>
                      </div>
                      <Badge className={palette.badgeClass}>{slot.orgUnitId}</Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : nextOpenDates.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[13px] text-muted">
                No upcoming posts scheduled yet. Pick an open day to inspect or book:
              </p>
              <div className="grid grid-cols-1 gap-2 pt-1">
                {nextOpenDates.map((isoDate) => (
                  <button
                    key={isoDate}
                    type="button"
                    onClick={() => void handleSelectDate(isoDate)}
                    className="lift press flex min-h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-line bg-elevated/70 px-3.5 text-[13px] font-medium text-ink hover:border-brand-glow/45"
                  >
                    <span>{formatShortDayLabel(isoDate)}</span>
                    <span className="font-mono text-[12px] text-brand-text">Open</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-muted">
              No future dates open in {monthHeading}.
            </p>
          )}
        </section>

        {/* Interactive Committee Activity Grid */}
        <section className="panel p-5">
          <div className="mb-3.5 flex items-center justify-between">
            <h3 className="font-display text-[16px] font-medium text-ink">Committees &amp; Units</h3>
            {unitFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setUnitFilter('ALL')}
                className="min-h-8 cursor-pointer rounded-full px-2.5 text-[12px] font-medium text-brand-text hover:bg-brand-soft"
              >
                Reset
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {orgUnits.map((unit) => {
              const palette = resolveAccentPalette(unit.accentToken);
              const count = unitCounts.get(unit.id) ?? 0;
              const active = unitFilter === unit.id;
              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => setUnitFilter(active ? 'ALL' : unit.id)}
                  className={`press flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 text-[13px] font-medium ${
                    active
                      ? 'border-brand-glow/55 bg-brand-soft text-white'
                      : 'border-line bg-sunken/70 text-ink-soft hover:border-line-strong hover:text-ink'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${palette.dotClass}`} />
                    <span className="truncate">{unit.code}</span>
                  </span>
                  <span className="font-mono text-[12px] text-muted tabular-nums">{count}</span>
                </button>
              );
            })}
          </div>
        </section>
      </aside>

      <BookingSheet
        selectedDate={selectedDate}
        todayCairo={todayCairo}
        slot={selectedSlot}
        orgUnits={orgUnits}
        isBusy={isBusy}
        onClose={() => setUiState({ kind: 'idle' })}
        onSelectDate={(nextDate) => {
          setMonth(nextDate.slice(0, 7));
          setUiState({ kind: 'inspectingOrBooking', date: nextDate });
        }}
        onBook={async (input, idempotencyKey) => {
          await bookMutation.mutateAsync({ input, idempotencyKey });
        }}
        onUpdate={async (id, input, idempotencyKey) => {
          await updateMutation.mutateAsync({ id, input, idempotencyKey });
        }}
        onQueueRelocation={async (id, input, idempotencyKey) => {
          await queueRelocationMutation.mutateAsync({ id, input, idempotencyKey });
        }}
        onOverride={async (input, idempotencyKey) => {
          await overrideMutation.mutateAsync({ input, idempotencyKey });
        }}
        onCancel={async (id, input, idempotencyKey) => {
          await cancelMutation.mutateAsync({ id, input, idempotencyKey });
        }}
      />

      <RelocationDrawer
        open={uiState.kind === 'relocationQueueOpen'}
        items={relocationQueue}
        orgUnitsById={orgUnitsById}
        isBusy={isBusy}
        onClose={() => setUiState({ kind: 'idle' })}
        onStartPlacement={(slot) => {
          setUiState({ kind: 'placingRelocation', slot });
        }}
        onCancelSlot={async (id, expectedVersion, idempotencyKey) => {
          await cancelMutation.mutateAsync({
            id,
            input: { expectedVersion },
            idempotencyKey,
          });
        }}
      />
    </div>
  );
}
