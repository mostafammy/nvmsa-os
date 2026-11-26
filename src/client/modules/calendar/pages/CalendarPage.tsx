import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeftRight,
  CalendarDays,
  ChevronRight,
  List,
  X,
} from 'lucide-react';
import { resolveAccentPalette } from '@shared/constants';
import type { ManagedSlotView } from '@shared/types';
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

  const daysInMonth = useMemo(() => {
    const { end } = getMonthDateBounds(month);
    return Number(end.slice(8, 10)) || 30;
  }, [month]);

  const fillPercent = Math.min(100, Math.round((monthScopedSlots.length / daysInMonth) * 100));

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
    <div className="animate-enter space-y-4 sm:space-y-5">
      {uiState.kind === 'placingRelocation' && (
        <div
          role="status"
          className="sticky top-[72px] z-20 flex items-center justify-between gap-3 rounded-2xl border border-brand bg-ink px-4 py-3 text-paper shadow-[0_14px_32px_-12px_rgb(20_32_30/0.45)]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 animate-[var(--animate-pulse-dot)] rounded-full bg-emerald-400"
            />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-paper">Placement mode active</p>
              <p dir="auto" className="truncate text-[13px] text-paper/80">
                Tap any open day for: {uiState.slot.title}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setUiState({ kind: 'idle' })}
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      )}

      {/* Command strip: live month occupancy + fluid segmented view switch + queue/mode */}
      <div className="panel flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[22px] font-medium leading-none tracking-[-0.02em] text-ink tabular-nums">
              {monthScopedSlots.length}
            </span>
            <span className="truncate text-[14px] text-muted">
              {unitFilter === 'ALL'
                ? `of ${daysInMonth} days booked`
                : `${unitFilter} posts in ${monthHeading}`}
            </span>
          </div>
          <div
            aria-hidden="true"
            className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-sunken"
          >
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-300 ease-[var(--ease-enter)]"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <div
            role="group"
            aria-label="Calendar layout"
            className="relative inline-grid grid-cols-2 rounded-full border border-line bg-sunken p-1"
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-1 start-1 w-[calc(50%-0.25rem)] rounded-full bg-surface shadow-[0_1px_3px_rgb(20_32_30/0.12)] transition-transform duration-[240ms] ease-[var(--ease-enter)]"
              style={{
                transform: effectiveViewMode === 'agenda' ? 'translateX(100%)' : 'translateX(0%)',
              }}
            />
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Month grid view"
              aria-pressed={effectiveViewMode === 'grid'}
              className={`relative z-10 inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors duration-150 ${
                effectiveViewMode === 'grid' ? 'text-ink' : 'text-muted hover:text-ink'
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
              className={`relative z-10 inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
                effectiveViewMode === 'agenda' ? 'text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Agenda</span>
            </button>
          </div>

          <RoleGate
            fallback={
              <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-sunken/80 px-3.5 text-[13px] font-medium text-ink-soft">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand" />
                Read-Only
              </span>
            }
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setUiState({ kind: 'relocationQueueOpen' })}
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span>Queue</span>
              <span className="font-mono text-[12px] text-muted">({relocationQueue.length})</span>
            </Button>
          </RoleGate>
        </div>
      </div>

      {/* Committee / division filter chips — every target >= 44x44px */}
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
          className={`press inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border px-4 text-[13px] font-medium transition-[background-color,border-color,color,transform] duration-150 ${
            unitFilter === 'ALL'
              ? 'border-ink bg-ink text-paper'
              : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink'
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
              className={`press inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-[background-color,border-color,color,transform] duration-150 ${
                active
                  ? 'border-ink bg-ink text-paper'
                  : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink'
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full ${active ? 'bg-paper' : palette.dotClass}`}
              />
              <span>{unit.code}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-[14px] text-red-900"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
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
          <div className="mb-4 flex items-center justify-between gap-3">
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-paper/60 px-6 py-12 text-center">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sunken text-ink-soft">
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
              <div className="mt-4 flex flex-wrap justify-center gap-2">
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
                      className="lift press group relative flex min-h-16 w-full cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-2xl border border-line bg-surface px-4 py-3 text-start hover:border-line-strong"
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute inset-y-0 start-0 w-1 ${palette.dotClass}`}
                      />
                      <div className="flex min-w-0 items-center gap-3.5 ps-1">
                        <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-sunken font-mono">
                          <span className="text-[15px] font-medium leading-none text-ink tabular-nums">
                            {dayNumber}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono text-[12px] text-brand-strong">{dayLabel}</p>
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
                        <ChevronRight className="h-4 w-4 text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-ink" />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

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
