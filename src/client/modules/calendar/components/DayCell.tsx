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

  let surfaceClass =
    'border-line bg-surface hover:border-brand/55 hover:bg-brand-soft/25';
  if (slot) {
    surfaceClass = `${palette.cellSurface} ${palette.cellBorder} shadow-[0_1px_2px_rgb(20_32_30/0.05)]`;
  } else if (canPlaceHere) {
    surfaceClass =
      'border-2 border-dashed border-brand bg-brand-soft/45 hover:bg-brand-soft/75';
  } else if (isToday) {
    surfaceClass =
      'border-brand/45 bg-brand-soft/35 hover:border-brand hover:bg-brand-soft/55';
  } else if (isPast) {
    surfaceClass =
      'border-transparent bg-sunken/65 hover:border-line hover:bg-sunken';
  }

  const stateLabel = slot
    ? `${slot.orgUnitId}: ${slot.title}`
    : canPlaceHere
      ? 'Available for placement'
      : isPast
        ? 'Past day'
        : 'Open day';

  return (
    <button
      type="button"
      data-iso-date={cell.isoDate}
      tabIndex={tabIndex}
      disabled={blockedInPlacement}
      aria-disabled={blockedInPlacement || undefined}
      aria-label={`${cell.isoDate}${isToday ? ', today' : ''}, ${stateLabel}`}
      onClick={() => onSelect(cell.isoDate)}
      onKeyDown={(event) => {
        if (onFocusMove) {
          onFocusMove(cell.isoDate, event.key);
        }
      }}
      className={`group lift press relative flex min-h-[72px] flex-col items-start justify-between overflow-hidden rounded-[14px] border p-1.5 text-start sm:min-h-[96px] sm:rounded-2xl sm:p-2.5 ${surfaceClass} ${
        !cell.inCurrentMonth ? 'opacity-45' : ''
      } ${isFilteredOut ? 'opacity-25' : ''} ${
        blockedInPlacement ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
      } ${isToday ? 'ring-2 ring-brand ring-offset-2 ring-offset-surface' : ''}`}
    >
      {slot && (
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 top-0 h-[3px] ${palette.dotClass}`}
        />
      )}

      <div className="flex w-full items-center justify-between gap-1">
        <span
          className={`font-mono text-[13px] font-medium leading-none tabular-nums sm:text-[14px] ${
            isToday
              ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white'
              : isPast && !slot
                ? 'text-muted'
                : 'text-ink'
          }`}
        >
          {cell.dayNumber}
        </span>

        {slot ? (
          canViewerEdit ? (
            <Pencil
              className="h-3.5 w-3.5 shrink-0 text-ink-soft"
              aria-hidden="true"
            />
          ) : (
            <Lock
              className="h-3.5 w-3.5 shrink-0 text-muted"
              aria-hidden="true"
            />
          )
        ) : (
          viewer &&
          (!isPast || viewer.capabilities.canBackfillPastDates) && (
            <Plus
              className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 group-hover:text-brand"
              aria-hidden="true"
            />
          )
        )}
      </div>

      {slot ? (
        <div className="mt-1.5 w-full min-w-0 space-y-1">
          <span
            className={`inline-block max-w-full truncate rounded-md border px-1 py-0.5 font-mono text-[12px] font-medium leading-none ${palette.badgeClass}`}
          >
            {slot.orgUnitId}
          </span>
          <p
            dir="auto"
            className="hidden line-clamp-2 break-words text-[12px] font-medium leading-snug text-ink sm:block"
          >
            {slot.title}
          </p>
        </div>
      ) : canPlaceHere ? (
        <span className="font-mono text-[12px] font-medium leading-none text-brand-strong">
          Place
        </span>
      ) : (
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 rounded-full transition-colors duration-150 ${
            isToday
              ? 'bg-brand'
              : isPast
                ? 'bg-transparent'
                : 'bg-ink/15 group-hover:bg-brand'
          }`}
        />
      )}
    </button>
  );
}
