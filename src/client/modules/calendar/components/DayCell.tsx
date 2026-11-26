import { Lock, Pencil, Plus } from 'lucide-react';
import { resolveAccentPalette } from '@shared/constants';
import type { OrgUnit, SeatSessionUser } from '@shared/types';
import type { CalendarGridCell } from '@shared/utils';
import type { CalendarSlotView } from '../hooks/useCalendarMonth';

interface DayCellProps {
  cell: CalendarGridCell;
  slot?: CalendarSlotView;
  orgUnit?: OrgUnit;
  isToday: boolean;
  isPast: boolean;
  isFilteredOut: boolean;
  isPlacementMode: boolean;
  viewer: SeatSessionUser | null;
  tabIndex?: number;
  onSelect: (isoDate: string) => void;
  onFocusMove?: (isoDate: string, key: string) => void;
}

export function DayCell({
  cell,
  slot,
  orgUnit,
  isToday,
  isPast,
  isFilteredOut,
  isPlacementMode,
  viewer,
  tabIndex = 0,
  onSelect,
  onFocusMove,
}: DayCellProps) {
  const palette = resolveAccentPalette(orgUnit?.accentToken);
  const canViewerEdit =
    Boolean(slot && viewer) &&
    (viewer?.capabilities.canMutateAnySlot || slot?.ownerSeatCode === viewer?.seatCode);

  const canPlaceHere =
    isPlacementMode &&
    !slot &&
    (!isPast || Boolean(viewer?.capabilities.canBackfillPastDates));

  const blockedInPlacement = isPlacementMode && (!canPlaceHere || Boolean(slot));

  let surfaceClass = 'border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50/40';
  if (slot) {
    surfaceClass = `${palette.cellSurface} ${palette.cellBorder} shadow-2xs hover:brightness-[0.98]`;
  } else if (canPlaceHere) {
    surfaceClass =
      'border-2 border-dashed border-teal-600 bg-teal-50/50 hover:bg-teal-100/60';
  } else if (isPast) {
    surfaceClass = 'border-slate-200/70 bg-slate-50 text-slate-500';
  }

  return (
    <button
      type="button"
      data-iso-date={cell.isoDate}
      tabIndex={tabIndex}
      disabled={blockedInPlacement}
      aria-disabled={blockedInPlacement || undefined}
      onClick={() => onSelect(cell.isoDate)}
      onKeyDown={(event) => {
        if (onFocusMove) {
          onFocusMove(cell.isoDate, event.key);
        }
      }}
      className={`group relative flex min-h-[78px] flex-col items-start justify-between rounded-xl border p-1.5 text-start transition-all sm:min-h-[90px] sm:p-2 ${surfaceClass} ${
        !cell.inCurrentMonth ? 'opacity-65' : ''
      } ${isFilteredOut ? 'opacity-30' : ''} ${
        blockedInPlacement ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'
      } ${isToday ? 'ring-2 ring-teal-700 ring-offset-1' : ''}`}
    >
      <div className="flex w-full items-center justify-between gap-1">
        <span
          className={`text-xs font-bold ${
            isToday
              ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-white'
              : isPast && !slot
                ? 'text-slate-500'
                : 'text-slate-800'
          }`}
        >
          {cell.dayNumber}
        </span>

        {slot ? (
          canViewerEdit ? (
            <Pencil className="h-3 w-3 shrink-0 text-slate-700" aria-label="Editable by you" />
          ) : (
            <Lock className="h-3 w-3 shrink-0 text-slate-600" aria-label="Booked" />
          )
        ) : (
          viewer &&
          (!isPast || viewer.capabilities.canBackfillPastDates) && (
            <Plus
              className="h-3.5 w-3.5 shrink-0 text-slate-500 group-hover:text-teal-700"
              aria-hidden="true"
            />
          )
        )}
      </div>

      {slot ? (
        <div className="mt-1 w-full min-w-0 space-y-0.5">
          <span
            className={`inline-block max-w-full truncate rounded-md border px-1.5 py-0.5 text-[10px] font-bold leading-tight ${palette.badgeClass}`}
          >
            {slot.orgUnitId}
          </span>
          <p
            dir="auto"
            className="line-clamp-2 break-words text-[10px] font-semibold leading-snug text-slate-800 sm:text-[11px]"
          >
            {slot.title}
          </p>
        </div>
      ) : (
        <span
          className={`text-[10px] font-semibold ${
            canPlaceHere
              ? 'text-teal-800'
              : isPast
                ? 'text-slate-500'
                : 'text-slate-600 group-hover:text-teal-800'
          }`}
        >
          {canPlaceHere ? 'Place' : isPast ? 'Past' : 'Open'}
        </span>
      )}
    </button>
  );
}
