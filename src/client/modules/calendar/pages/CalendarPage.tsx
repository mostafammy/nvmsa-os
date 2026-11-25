import { useState } from 'react';
import { ArrowLeftRight, CalendarCheck2 } from 'lucide-react';
import { RoleGate } from '../../../core/auth/RoleGate';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { BookingSheet } from '../components/BookingSheet';
import { CalendarGrid } from '../components/CalendarGrid';
import { RelocationDrawer } from '../components/RelocationDrawer';
import { useCalendarMonth } from '../hooks/useCalendarMonth';
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
            <strong className="text-slate-900">{slotsByDate.size}</strong> booked this month
          </span>
        </div>

        <RoleGate
          minimumRole="eb"
          fallback={<Badge className="bg-slate-100 text-slate-600 border-slate-200">Read-Only View</Badge>}
        >
          <Button variant="secondary" size="sm" onClick={() => setQueueOpen(true)}>
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Relocation Queue ({relocationQueue.length})
          </Button>
        </RoleGate>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {error instanceof Error ? error.message : 'Unable to reach calendar API'}
        </div>
      )}

      <CalendarGrid
        monthHeading={monthHeading}
        todayCairo={todayCairo}
        cells={gridCells}
        slotsByDate={slotsByDate}
        isFetching={isFetching}
        onPrevMonth={goToPrevMonth}
        onNextMonth={goToNextMonth}
        onToday={goToToday}
        onSelectDate={setSelectedDate}
      />

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
        isBusy={isBusy}
        onClose={() => setQueueOpen(false)}
        onReschedule={async (id, targetDate, reason) => {
          await relocateMutation.mutateAsync({ id, input: { targetDate, reason } });
        }}
      />
    </div>
  );
}
