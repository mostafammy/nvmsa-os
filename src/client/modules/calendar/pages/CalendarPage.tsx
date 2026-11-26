import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, CalendarCheck2, CalendarDays, List, X } from 'lucide-react';
import { resolveAccentPalette } from '@shared/constants';
import type { ManagedSlotView } from '@shared/types';
import { formatShortDayLabel } from '@shared/utils';
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
    <div className="space-y-3">
      {uiState.kind === 'placingRelocation' && (
        <div className="sticky top-[62px] z-20 flex items-center justify-between gap-3 rounded-2xl border border-teal-700 bg-teal-900 px-4 py-3 text-xs text-white shadow-md">
          <div className="min-w-0">
            <p className="font-bold">Placement Mode</p>
            <p dir="auto" className="truncate text-teal-100">
              Tap any open day for: {uiState.slot.title}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setUiState({ kind: 'idle' })}
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <CalendarCheck2 className="h-4 w-4 text-teal-700" />
          <span>
            <strong className="text-slate-900">{monthScopedSlots.length}</strong>{' '}
            {unitFilter === 'ALL' ? 'booked this month' : `${unitFilter} posts`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Month grid view"
              className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
                effectiveViewMode === 'grid'
                  ? 'bg-white text-teal-700 shadow-2xs'
                  : 'text-slate-600'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              disabled={isPlacementMode}
              onClick={() => setViewMode('agenda')}
              aria-label="Agenda list view"
              className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold disabled:opacity-40 ${
                effectiveViewMode === 'agenda'
                  ? 'bg-white text-teal-700 shadow-2xs'
                  : 'text-slate-600'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Agenda</span>
            </button>
          </div>

          <RoleGate
            fallback={
              <Badge className="border-slate-200 bg-slate-100 text-slate-700">Read-Only</Badge>
            }
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setUiState({ kind: 'relocationQueueOpen' })}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Queue ({relocationQueue.length})
            </Button>
          </RoleGate>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setUnitFilter('ALL')}
          className={`shrink-0 cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
            unitFilter === 'ALL'
              ? 'border-teal-700 bg-teal-700 text-white'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          All
        </button>
        {orgUnits.map((unit) => (
          <button
            key={unit.id}
            type="button"
            onClick={() => setUnitFilter(unit.id)}
            className={`shrink-0 cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              unitFilter === unit.id
                ? 'border-teal-700 bg-teal-700 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {unit.code}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {error instanceof Error ? error.message : 'Unable to reach calendar API'}
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
        <section className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">{monthHeading} — Agenda</h2>
            <Button variant="ghost" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
          {monthScopedSlots.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-600">
              No booked posts match this filter in {monthHeading}.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {monthScopedSlots.map((slot) => {
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
                      className="-mx-2 flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-3 text-start hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-teal-700">
                          {slot.postDate ? formatShortDayLabel(slot.postDate) : 'Pending'}
                        </p>
                        <p dir="auto" className="truncate text-sm font-bold text-slate-900">
                          {slot.title}
                        </p>
                        <p className="text-xs text-slate-600">
                          {slot.contentType} · {slot.creatorName}
                        </p>
                      </div>
                      <Badge className={palette.badgeClass}>{slot.orgUnitId}</Badge>
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
