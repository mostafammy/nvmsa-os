import { useMemo, useState } from 'react';
import { ArrowLeftRight, CalendarCheck2, CalendarDays, List } from 'lucide-react';
import { NVMSA_ENTITIES, NVMSA_ENTITY_MAP, type NvmsaEntityCode } from '@shared/constants';
import { formatShortDayLabel } from '@shared/utils';
import { RoleGate } from '../../../core/auth/RoleGate';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { BookingSheet } from '../components/BookingSheet';
import { CalendarGrid } from '../components/CalendarGrid';
import { RelocationDrawer } from '../components/RelocationDrawer';
import { useCalendarMonth, type CalendarSlotView } from '../hooks/useCalendarMonth';
import { useOptimisticBooking } from '../hooks/useOptimisticBooking';

export function CalendarPage() {
  const {
    month,
    monthHeading,
    todayCairo,
    gridCells,
    slotsByDate,
    relocationQueue,
    isFetching,
    error,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
  } = useCalendarMonth();

  const { bookMutation, updateMutation, relocateMutation, cancelMutation } =
    useOptimisticBooking(month);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');
  const [entityFilter, setEntityFilter] = useState<NvmsaEntityCode | 'ALL'>('ALL');

  const bookedDates = useMemo(() => new Set(slotsByDate.keys()), [slotsByDate]);

  const filteredSlotsByDate = useMemo(() => {
    if (entityFilter === 'ALL') return slotsByDate;
    const next = new Map<string, CalendarSlotView>();
    for (const [date, slot] of slotsByDate.entries()) {
      if (slot.entityCode === entityFilter) {
        next.set(date, slot);
      }
    }
    return next;
  }, [slotsByDate, entityFilter]);

  const agendaSlots = useMemo(
    () =>
      [...filteredSlotsByDate.values()].sort((a, b) => a.postDate.localeCompare(b.postDate)),
    [filteredSlotsByDate],
  );

  const selectedSlot = selectedDate ? slotsByDate.get(selectedDate) : undefined;
  const isBusy =
    bookMutation.isPending ||
    updateMutation.isPending ||
    relocateMutation.isPending ||
    cancelMutation.isPending;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <CalendarCheck2 className="h-4 w-4 text-teal-700" />
          <span>
            <strong className="text-slate-900">{filteredSlotsByDate.size}</strong>{' '}
            {entityFilter === 'ALL' ? 'booked this month' : `${entityFilter} posts`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Month grid view"
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-500'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              aria-label="Agenda list view"
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold cursor-pointer ${
                viewMode === 'agenda' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-500'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Agenda</span>
            </button>
          </div>

          <RoleGate
            minimumRole="eb"
            fallback={
              <Badge className="bg-slate-100 text-slate-600 border-slate-200">Read-Only</Badge>
            }
          >
            <Button variant="secondary" size="sm" onClick={() => setQueueOpen(true)}>
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Queue ({relocationQueue.length})
            </Button>
          </RoleGate>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setEntityFilter('ALL')}
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
            entityFilter === 'ALL'
              ? 'border-teal-700 bg-teal-700 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          All
        </button>
        {NVMSA_ENTITIES.map((entity) => (
          <button
            key={entity.code}
            type="button"
            onClick={() => setEntityFilter(entity.code)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              entityFilter === entity.code
                ? 'border-teal-700 bg-teal-700 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {entity.code}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {error instanceof Error ? error.message : 'Unable to reach calendar API'}
        </div>
      )}

      {viewMode === 'grid' ? (
        <CalendarGrid
          monthHeading={monthHeading}
          todayCairo={todayCairo}
          cells={gridCells}
          slotsByDate={filteredSlotsByDate}
          isFetching={isFetching}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
          onSelectDate={setSelectedDate}
        />
      ) : (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">{monthHeading} — Agenda</h2>
            <Button variant="ghost" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
          {agendaSlots.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No booked posts match this filter in {monthHeading}.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {agendaSlots.map((slot) => (
                <li key={slot.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(slot.postDate)}
                    className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-slate-50 rounded-xl px-2 -mx-2 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-teal-700">
                        {formatShortDayLabel(slot.postDate)}
                      </p>
                      <p className="truncate text-sm font-bold text-slate-900">{slot.title}</p>
                      <p className="text-xs text-slate-500">
                        {slot.format} · {slot.creatorName}
                      </p>
                    </div>
                    <Badge className={NVMSA_ENTITY_MAP[slot.entityCode].badgeClass}>
                      {slot.entityCode}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <BookingSheet
        selectedDate={selectedDate}
        slot={selectedSlot}
        isBusy={isBusy}
        onClose={() => setSelectedDate(null)}
        onBook={async (input) => {
          await bookMutation.mutateAsync(input);
        }}
        onUpdate={async (id, input) => {
          await updateMutation.mutateAsync({ id, input });
        }}
        onQueueRelocation={async (id, input) => {
          await relocateMutation.mutateAsync({ id, input });
        }}
        onCancel={async (id) => {
          await cancelMutation.mutateAsync(id);
        }}
      />

      <RelocationDrawer
        open={queueOpen}
        items={relocationQueue}
        bookedDates={bookedDates}
        isBusy={isBusy}
        onClose={() => setQueueOpen(false)}
        onReschedule={async (id, targetDate, reason, expectedVersion) => {
          await relocateMutation.mutateAsync({
            id,
            input: { targetDate, reason, expectedVersion },
          });
        }}
      />
    </div>
  );
}
