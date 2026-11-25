import { useState } from 'react';
import { NVMSA_ENTITY_MAP } from '@shared/constants';
import type { ManagedSlotView } from '@shared/types';
import { getTodayCairoDate } from '@shared/utils';
import { useSession } from '../../../core/auth/useSession';
import { Badge } from '../../../ui/Badge';
import { BottomSheet } from '../../../ui/BottomSheet';
import { Button } from '../../../ui/Button';

interface RelocationDrawerProps {
  open: boolean;
  items: ManagedSlotView[];
  bookedDates: Set<string>;
  isBusy: boolean;
  onClose: () => void;
  onReschedule: (
    id: string,
    targetDate: string,
    reason: string,
    expectedVersion: number,
  ) => Promise<void>;
}

export function RelocationDrawer({
  open,
  items,
  bookedDates,
  isBusy,
  onClose,
  onReschedule,
}: RelocationDrawerProps) {
  const { user } = useSession();
  const [targetDates, setTargetDates] = useState<Record<string, string>>({});
  const todayCairo = getTodayCairoDate();

  return (
    <BottomSheet
      open={open}
      title="Relocation Queue"
      subtitle="Paused posts waiting to be assigned to an open Cairo calendar date."
      onClose={onClose}
    >
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No posts are waiting in the Relocation Queue.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const canManage =
              user !== null && (user.role === 'admin' || user.id === item.creatorId);
            const pickedDate = targetDates[item.id] ?? '';
            const isDateOccupied = pickedDate !== '' && bookedDates.has(pickedDate);

            return (
              <li
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      Originally {item.postDate} · {item.creatorName}
                    </p>
                  </div>
                  <Badge className={NVMSA_ENTITY_MAP[item.entityCode].badgeClass}>
                    {item.entityCode}
                  </Badge>
                </div>

                {item.relocationReason && (
                  <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
                    Reason: {item.relocationReason}
                  </p>
                )}

                {canManage ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        min={user?.role === 'admin' ? undefined : todayCairo}
                        value={pickedDate}
                        onChange={(e) =>
                          setTargetDates((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                      />
                      <Button
                        size="sm"
                        disabled={!pickedDate || isDateOccupied || isBusy}
                        onClick={async () => {
                          await onReschedule(
                            item.id,
                            pickedDate,
                            item.relocationReason ?? 'Rescheduled from Relocation Queue',
                            item.version,
                          );
                        }}
                      >
                        Assign Date
                      </Button>
                    </div>
                    {isDateOccupied && (
                      <p className="text-[11px] font-medium text-red-600">
                        {pickedDate} is already booked. Pick an open date.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Only {item.creatorName} or an Admin can reassign this post.
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
