import { ArrowLeftRight, CalendarPlus, Trash2 } from 'lucide-react';
import { resolveAccentPalette } from '@shared/constants';
import type { ManagedSlotView, OrgUnit } from '@shared/types';
import { createIdempotencyKey } from '../../../core/api/client';
import { useSession } from '../../../core/auth/useSession';
import { Badge } from '../../../ui/Badge';
import { BottomSheet } from '../../../ui/BottomSheet';
import { Button } from '../../../ui/Button';

interface RelocationDrawerProps {
  open: boolean;
  items: ManagedSlotView[];
  orgUnitsById: Map<string, OrgUnit>;
  isBusy: boolean;
  onClose: () => void;
  onStartPlacement: (slot: ManagedSlotView) => void;
  onCancelSlot: (
    id: string,
    expectedVersion: number,
    idempotencyKey: string,
  ) => Promise<void>;
}

export function RelocationDrawer({
  open,
  items,
  orgUnitsById,
  isBusy,
  onClose,
  onStartPlacement,
  onCancelSlot,
}: RelocationDrawerProps) {
  const { user } = useSession();

  return (
    <BottomSheet
      open={open}
      title="Relocation Queue"
      subtitle="Paused posts waiting to be placed on an open Cairo calendar day."
      onClose={onClose}
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-paper/60 px-6 py-10 text-center">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sunken text-ink-soft">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
          <p className="text-[15px] font-medium text-ink">Queue is empty</p>
          <p className="mt-1 text-[14px] text-muted">
            No posts are waiting to be placed on a new Cairo day.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const palette = resolveAccentPalette(orgUnitsById.get(item.orgUnitId)?.accentToken);
            const canManage =
              user !== null &&
              (user.capabilities.canMutateAnySlot || user.seatCode === item.ownerSeatCode);

            return (
              <li
                key={item.id}
                className="relative space-y-3 overflow-hidden rounded-2xl border border-line bg-paper p-4"
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-0 start-0 w-1 ${palette.dotClass}`}
                />
                <div className="flex items-start justify-between gap-2 ps-1">
                  <div className="min-w-0">
                    <p dir="auto" className="truncate text-[15px] font-medium text-ink">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[13px] text-muted">
                      {item.previousDate ? `Originally ${item.previousDate} · ` : ''}
                      {item.ownerSeatCode} ({item.creatorName})
                    </p>
                  </div>
                  <Badge className={palette.badgeClass}>{item.orgUnitId}</Badge>
                </div>

                {item.relocationReason && (
                  <p
                    dir="auto"
                    className="ms-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-950"
                  >
                    Reason: {item.relocationReason}
                  </p>
                )}

                {canManage ? (
                  <div className="flex items-center gap-2 ps-1">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={isBusy}
                      onClick={() => onStartPlacement(item)}
                    >
                      <CalendarPlus className="h-4 w-4" />
                      Assign New Day
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-11 !px-0 text-red-700 hover:bg-red-50 hover:text-red-800"
                      aria-label={`Cancel ${item.title}`}
                      disabled={isBusy}
                      onClick={() =>
                        void onCancelSlot(item.id, item.version, createIdempotencyKey())
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="ps-1 text-[13px] text-muted">
                    Only {item.ownerSeatCode} or an authorized lead can reassign this post.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </BottomSheet>
  );
}
