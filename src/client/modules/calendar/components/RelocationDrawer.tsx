import { CalendarPlus, Trash2 } from 'lucide-react';
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
        <p className="py-6 text-center text-sm text-slate-600">
          No posts are waiting in the Relocation Queue.
        </p>
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
                className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p dir="auto" className="truncate text-sm font-bold text-slate-900">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-600">
                      {item.previousDate ? `Originally ${item.previousDate} · ` : ''}
                      {item.ownerSeatCode} ({item.creatorName})
                    </p>
                  </div>
                  <Badge className={palette.badgeClass}>{item.orgUnitId}</Badge>
                </div>

                {item.relocationReason && (
                  <p dir="auto" className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-950">
                    Reason: {item.relocationReason}
                  </p>
                )}

                {canManage ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={isBusy}
                      onClick={() => onStartPlacement(item)}
                    >
                      <CalendarPlus className="h-3.5 w-3.5" />
                      Assign New Day
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Cancel ${item.title}`}
                      disabled={isBusy}
                      onClick={() =>
                        void onCancelSlot(item.id, item.version, createIdempotencyKey())
                      }
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-600">
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
