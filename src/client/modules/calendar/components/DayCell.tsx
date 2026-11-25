import { NVMSA_ENTITY_MAP } from '@shared/constants';
import type { CalendarGridCell } from '@shared/utils';
import type { CalendarSlotView } from '../hooks/useCalendarMonth';

interface DayCellProps {
  cell: CalendarGridCell;
  slot?: CalendarSlotView;
  isToday: boolean;
  onSelect: (isoDate: string) => void;
}

export function DayCell({ cell, slot, isToday, onSelect }: DayCellProps) {
  const entity = slot ? NVMSA_ENTITY_MAP[slot.entityCode] : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(cell.isoDate)}
      className={`group relative flex min-h-[74px] flex-col items-start justify-between rounded-xl border p-1.5 text-left transition-all cursor-pointer sm:min-h-[88px] sm:p-2 ${
        !cell.inCurrentMonth
          ? 'border-transparent bg-slate-100/50 text-slate-400'
          : slot
            ? 'border-slate-200 bg-white shadow-2xs hover:border-teal-400'
            : 'border-slate-200/70 bg-white/80 hover:border-teal-300 hover:bg-teal-50/30'
      } ${isToday ? 'ring-2 ring-teal-600 ring-offset-1' : ''}`}
    >
      <div className="flex w-full items-center justify-between">
        <span
          className={`text-xs font-bold ${
            isToday
              ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-white'
              : cell.inCurrentMonth
                ? 'text-slate-700'
                : 'text-slate-400'
          }`}
        >
          {cell.dayNumber}
        </span>
        {slot && (
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entity?.color ?? '#0f766e' }}
            aria-hidden="true"
          />
        )}
      </div>

      {slot ? (
        <div className="mt-1 w-full space-y-0.5">
          <span
            className={`inline-block max-w-full truncate rounded-md border px-1.5 py-0.5 text-[10px] font-bold leading-tight ${
              entity?.badgeClass ?? 'bg-teal-100 text-teal-800 border-teal-200'
            }`}
          >
            {slot.entityCode}
          </span>
          <p className="line-clamp-1 text-[10px] font-medium text-slate-600 sm:text-[11px]">
            {slot.title}
          </p>
        </div>
      ) : (
        cell.inCurrentMonth && (
          <span className="text-[10px] font-medium text-slate-300 group-hover:text-teal-600">
            Open
          </span>
        )
      )}
    </button>
  );
}
