import { useEffect, useState, type FormEvent } from 'react';
import {
  NVMSA_ENTITIES,
  NVMSA_ENTITY_MAP,
  hasMinimumRole,
  type NvmsaEntityCode,
} from '@shared/constants';
import type {
  CreateSlotInput,
  ManagedSlotView,
  PostFormat,
  RelocateSlotInput,
  UpdateSlotInput,
} from '@shared/types';
import { formatShortDayLabel, getTodayCairoDate } from '@shared/utils';
import { useSession } from '../../../core/auth/useSession';
import { Badge } from '../../../ui/Badge';
import { BottomSheet } from '../../../ui/BottomSheet';
import { Button } from '../../../ui/Button';
import type { CalendarSlotView } from '../hooks/useCalendarMonth';

const POST_FORMATS: { value: PostFormat; label: string }[] = [
  { value: 'poster', label: 'Poster' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'reel', label: 'Reel' },
  { value: 'story', label: 'Story' },
  { value: 'announcement', label: 'Announcement' },
];

function isManagedSlot(slot: CalendarSlotView): slot is ManagedSlotView {
  return 'creatorId' in slot;
}

interface BookingSheetProps {
  selectedDate: string | null;
  slot?: CalendarSlotView;
  isBusy: boolean;
  onClose: () => void;
  onBook: (input: CreateSlotInput) => Promise<void>;
  onUpdate: (id: string, input: UpdateSlotInput) => Promise<void>;
  onQueueRelocation: (id: string, input: RelocateSlotInput) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}

export function BookingSheet({
  selectedDate,
  slot,
  isBusy,
  onClose,
  onBook,
  onUpdate,
  onQueueRelocation,
  onCancel,
}: BookingSheetProps) {
  const { user } = useSession();
  const canBook = user !== null && hasMinimumRole(user.role, 'eb');
  const canEdit =
    slot !== undefined &&
    user !== null &&
    (user.role === 'admin' || (isManagedSlot(slot) && slot.creatorId === user.id));

  const todayCairo = getTodayCairoDate();
  const isPastDate = selectedDate !== null && selectedDate < todayCairo;
  const blockedPastBooking = !slot && isPastDate && user?.role !== 'admin';

  const [title, setTitle] = useState('');
  const [entityCode, setEntityCode] = useState<NvmsaEntityCode>('SCOPH');
  const [format, setFormat] = useState<PostFormat>('poster');
  const [notes, setNotes] = useState('');
  const [relocationReason, setRelocationReason] = useState('');
  const [showRelocateForm, setShowRelocateForm] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (slot) {
      setTitle(slot.title);
      setEntityCode(slot.entityCode);
      setFormat(slot.format);
      setNotes(isManagedSlot(slot) ? (slot.notes ?? '') : '');
    } else {
      setTitle('');
      setEntityCode(user?.entityCode ?? 'SCOPH');
      setFormat('poster');
      setNotes('');
    }
    setRelocationReason('');
    setShowRelocateForm(false);
    setConfirmCancel(false);
  }, [slot, selectedDate, user?.entityCode]);

  if (!selectedDate) return null;

  const dayLabel = formatShortDayLabel(selectedDate);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

    if (slot && canEdit) {
      await onUpdate(slot.id, {
        title: title.trim(),
        entityCode,
        format,
        notes: notes.trim() || null,
        expectedVersion: isManagedSlot(slot) ? slot.version : undefined,
      });
      onClose();
      return;
    }

    if (!slot && canBook && !blockedPastBooking) {
      await onBook({
        postDate: selectedDate,
        title: title.trim(),
        entityCode,
        format,
        notes: notes.trim() || null,
      });
      onClose();
    }
  };

  const handleQueueRelocation = async (event: FormEvent) => {
    event.preventDefault();
    if (!slot || !relocationReason.trim()) return;
    await onQueueRelocation(slot.id, {
      reason: relocationReason.trim(),
      expectedVersion: isManagedSlot(slot) ? slot.version : undefined,
    });
    onClose();
  };

  return (
    <BottomSheet
      open={Boolean(selectedDate)}
      title={slot ? slot.title : `Book ${dayLabel}`}
      subtitle={`${dayLabel} · Africa/Cairo (1 post/day rule)`}
      onClose={onClose}
    >
      {slot && !canEdit ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={NVMSA_ENTITY_MAP[slot.entityCode].badgeClass}>
              {slot.entityCode}
            </Badge>
            <Badge>{slot.format}</Badge>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Booked</Badge>
          </div>
          <div className="rounded-xl bg-slate-50 p-3.5 text-sm text-slate-700 space-y-1">
            <p className="font-semibold text-slate-900">
              {NVMSA_ENTITY_MAP[slot.entityCode].name}
            </p>
            <p className="text-xs text-slate-500">Booked by {slot.creatorName}</p>
            {isManagedSlot(slot) && slot.notes && (
              <p className="pt-2 text-xs text-slate-600">{slot.notes}</p>
            )}
          </div>
          <p className="text-xs text-slate-500">
            This date is locked. Only the creator or an Admin can edit, relocate, or cancel it.
          </p>
        </div>
      ) : !slot && !canBook ? (
        <div className="space-y-3 py-2 text-center">
          <p className="text-sm font-semibold text-slate-800">This date is open</p>
          <p className="text-xs text-slate-500">
            Officers have read-only calendar access. Sign in as an EB Member or Admin to book a
            content slot.
          </p>
        </div>
      ) : blockedPastBooking ? (
        <div className="space-y-2 py-2 text-center">
          <p className="text-sm font-semibold text-slate-800">Past Date Locked</p>
          <p className="text-xs text-slate-500">
            Bookings cannot be created on past Cairo dates ({selectedDate}). Contact an Admin if a
            historical backfill is required.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Post Title</label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., World Health Day Awareness Campaign"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Committee / Division
                </label>
                <select
                  value={entityCode}
                  onChange={(e) => setEntityCode(e.target.value as NvmsaEntityCode)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                >
                  {NVMSA_ENTITIES.map((entity) => (
                    <option key={entity.code} value={entity.code}>
                      {entity.code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as PostFormat)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                >
                  {POST_FORMATS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Internal Notes (EB / Admin only)
              </label>
              <textarea
                rows={2}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Design link, target publish time, or caption notes..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <Button type="submit" disabled={isBusy} className="w-full">
              {slot ? 'Save Changes' : 'Lock Post Slot'}
            </Button>
          </form>

          {slot && canEdit && (
            <div className="border-t border-slate-100 pt-3 space-y-2.5">
              {confirmCancel ? (
                <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-semibold text-red-900">
                    Cancel this booked slot? This immediately frees {selectedDate} for other
                    committees.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={isBusy}
                      className="flex-1"
                      onClick={async () => {
                        await onCancel(slot.id);
                        onClose();
                      }}
                    >
                      Confirm Cancel
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setConfirmCancel(false)}
                    >
                      Keep Slot
                    </Button>
                  </div>
                </div>
              ) : showRelocateForm ? (
                <form onSubmit={handleQueueRelocation} className="space-y-2 rounded-xl bg-amber-50 p-3">
                  <label className="block text-xs font-semibold text-amber-900">
                    Reason for moving to Relocation Queue
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={280}
                    value={relocationReason}
                    onChange={(e) => setRelocationReason(e.target.value)}
                    placeholder="e.g., Waiting for final poster approval"
                    className="w-full rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs text-slate-900"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={isBusy} className="flex-1">
                      Confirm Move
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRelocateForm(false)}
                    >
                      Back
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => setShowRelocateForm(true)}
                  >
                    Move to Queue
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => setConfirmCancel(true)}
                  >
                    Cancel Slot
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
