import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Copy, ExternalLink, History, ShieldAlert } from 'lucide-react';
import { resolveAccentPalette } from '@shared/constants';
import type {
  BookSlotInput,
  CancelSlotInput,
  ConflictWinnerPayload,
  ContentType,
  ManagedSlotView,
  OrgUnit,
  OverrideSlotInput,
  QueueRelocationInput,
  SeatSessionUser,
  UpdateSlotInput,
} from '@shared/types';
import { formatShortDayLabel } from '@shared/utils';
import { ApiRequestError, createIdempotencyKey } from '../../../core/api/client';
import { useSession } from '../../../core/auth/useSession';
import { Badge } from '../../../ui/Badge';
import { BottomSheet } from '../../../ui/BottomSheet';
import { Button } from '../../../ui/Button';
import { calendarKeys, fetchSlotHistory } from '../api/calendar.queries';
import type { CalendarSlotView } from '../hooks/useCalendarMonth';

const DRAFT_STORAGE_KEY = 'nvmsa_os_booking_draft';

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'POST', label: 'Post' },
  { value: 'PHOTO', label: 'Photo' },
  { value: 'REEL', label: 'Reel' },
  { value: 'COLLAB', label: 'Collab' },
  { value: 'STORY_CAMPAIGN', label: 'Story Campaign' },
];

interface SavedBookingDraft {
  postDate: string;
  orgUnitId: string;
  contentType: ContentType;
  title: string;
  notes: string;
  assetUrl: string;
}

function isManagedSlot(slot: CalendarSlotView): slot is ManagedSlotView {
  return 'createdAt' in slot;
}

function readDraftForDate(postDate: string): SavedBookingDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedBookingDraft;
    return parsed.postDate === postDate ? parsed : null;
  } catch {
    return null;
  }
}

function resolvePermittedOrgUnits(
  user: SeatSessionUser | null,
  orgUnits: OrgUnit[],
): OrgUnit[] {
  if (!user) return [];
  if (user.capabilities.canBookAnyUnit) {
    return orgUnits.filter((u) => u.isActive);
  }
  const allowedSet = new Set(user.allowedOrgUnits);
  return orgUnits.filter((u) => u.isActive && allowedSet.has(u.id));
}

function OrgUnitPicker({
  permittedUnits,
  value,
  onChange,
}: {
  permittedUnits: OrgUnit[];
  value: string;
  onChange: (nextUnitId: string) => void;
}) {
  if (permittedUnits.length <= 1) {
    const only = permittedUnits[0];
    const palette = resolveAccentPalette(only?.accentToken);
    return (
      <div className="flex h-[38px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
        <Badge className={palette.badgeClass}>{only?.code ?? value}</Badge>
      </div>
    );
  }

  if (permittedUnits.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {permittedUnits.map((unit) => {
          const active = value === unit.id;
          return (
            <button
              key={unit.id}
              type="button"
              onClick={() => onChange(unit.id)}
              className={`cursor-pointer rounded-lg py-1.5 text-xs font-bold transition-colors ${
                active
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              {unit.code}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <select
      aria-label="Committee or Division"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
    >
      {permittedUnits.map((unit) => (
        <option key={unit.id} value={unit.id}>
          {unit.code} — {unit.name}
        </option>
      ))}
    </select>
  );
}

function SlotAuditTimeline({ slotId }: { slotId: string }) {
  const { data: history, isLoading } = useQuery({
    queryKey: calendarKeys.history(slotId),
    queryFn: () => fetchSlotHistory(slotId),
  });

  if (isLoading) {
    return <p className="text-xs text-slate-500">Loading history...</p>;
  }
  if (!history || history.length === 0) {
    return <p className="text-xs text-slate-500">No audit entries recorded yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {history.map((entry) => (
        <li
          key={entry.id}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-slate-800">{entry.action}</span>
            <span className="text-[11px] text-slate-500">
              {new Date(entry.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="mt-0.5 text-slate-600">
            By {entry.actorName} ({entry.actorRole})
          </p>
        </li>
      ))}
    </ul>
  );
}

interface BookingSheetProps {
  selectedDate: string | null;
  todayCairo: string;
  slot?: CalendarSlotView;
  orgUnits: OrgUnit[];
  isBusy: boolean;
  onClose: () => void;
  onSelectDate: (isoDate: string) => void;
  onBook: (input: BookSlotInput, idempotencyKey: string) => Promise<void>;
  onUpdate: (id: string, input: UpdateSlotInput, idempotencyKey: string) => Promise<void>;
  onQueueRelocation: (
    id: string,
    input: QueueRelocationInput,
    idempotencyKey: string,
  ) => Promise<void>;
  onOverride: (input: OverrideSlotInput, idempotencyKey: string) => Promise<void>;
  onCancel: (id: string, input: CancelSlotInput, idempotencyKey: string) => Promise<void>;
}

export function BookingSheet({
  selectedDate,
  todayCairo,
  slot,
  orgUnits,
  isBusy,
  onClose,
  onSelectDate,
  onBook,
  onUpdate,
  onQueueRelocation,
  onOverride,
  onCancel,
}: BookingSheetProps) {
  const { user, signInWithGoogle } = useSession();

  const permittedUnits = useMemo(
    () => resolvePermittedOrgUnits(user, orgUnits),
    [orgUnits, user],
  );
  const canEdit =
    slot !== undefined &&
    user !== null &&
    (user.capabilities.canMutateAnySlot || slot.ownerSeatCode === user.seatCode);
  const canOverride = slot !== undefined && Boolean(user?.capabilities.canMutateAnySlot);
  const requiresSuperAdminReason = user?.tier === 'super_admin';

  const isPastDate = selectedDate !== null && selectedDate < todayCairo;
  const blockedPastBooking = !slot && isPastDate && !user?.capabilities.canBackfillPastDates;

  const [title, setTitle] = useState('');
  const [orgUnitId, setOrgUnitId] = useState('EB');
  const [contentType, setContentType] = useState<ContentType>('POST');
  const [notes, setNotes] = useState('');
  const [assetUrl, setAssetUrl] = useState('');
  const [reason, setReason] = useState('');
  const [relocationReason, setRelocationReason] = useState('');
  const [showRelocateForm, setShowRelocateForm] = useState(false);
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [expectedVersion, setExpectedVersion] = useState(1);
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey());
  const [conflictInfo, setConflictInfo] = useState<ConflictWinnerPayload | null>(null);
  const [staleLatest, setStaleLatest] = useState<ManagedSlotView | null>(null);

  useEffect(() => {
    setConflictInfo(null);
    setStaleLatest(null);
    setShowRelocateForm(false);
    setShowOverrideForm(false);
    setShowHistory(false);
    setConfirmCancel(false);
    setCopiedSummary(false);
    setReason('');
    setRelocationReason('');
    setIdempotencyKey(createIdempotencyKey());

    if (slot) {
      setTitle(slot.title);
      setOrgUnitId(slot.orgUnitId);
      setContentType(slot.contentType);
      setAssetUrl(slot.assetUrl ?? '');
      setNotes(isManagedSlot(slot) ? (slot.notes ?? '') : '');
      setExpectedVersion(slot.version);
      return;
    }

    const draft = selectedDate ? readDraftForDate(selectedDate) : null;
    if (draft) {
      setTitle(draft.title);
      setOrgUnitId(draft.orgUnitId);
      setContentType(draft.contentType);
      setNotes(draft.notes);
      setAssetUrl(draft.assetUrl);
      if (user) {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      }
      return;
    }

    setTitle('');
    setOrgUnitId(permittedUnits[0]?.id ?? user?.defaultOrgUnitId ?? 'EB');
    setContentType('POST');
    setNotes('');
    setAssetUrl('');
    setExpectedVersion(1);
  }, [slot, selectedDate, user, permittedUnits]);

  if (!selectedDate) return null;

  const dayLabel = formatShortDayLabel(selectedDate);
  const slotUnit = slot ? orgUnits.find((u) => u.id === slot.orgUnitId) : undefined;
  const slotPalette = resolveAccentPalette(slotUnit?.accentToken);

  const handleMutationFailure = (err: unknown) => {
    if (err instanceof ApiRequestError) {
      if (err.status === 409 && err.details && typeof err.details === 'object') {
        setConflictInfo(err.details as ConflictWinnerPayload);
        return;
      }
      if (err.status === 412 && err.details && typeof err.details === 'object') {
        const latest = (err.details as { latest?: ManagedSlotView }).latest;
        if (latest) {
          setStaleLatest(latest);
          return;
        }
      }
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setConflictInfo(null);
    setStaleLatest(null);

    try {
      if (slot && canEdit) {
        await onUpdate(
          slot.id,
          {
            orgUnitId,
            contentType,
            title: title.trim(),
            notes: notes.trim() || null,
            assetUrl: assetUrl.trim() || null,
            expectedVersion,
            ...(reason.trim() ? { reason: reason.trim() } : {}),
          },
          idempotencyKey,
        );
        onClose();
        return;
      }

      if (!slot && user && !blockedPastBooking) {
        await onBook(
          {
            postDate: selectedDate,
            orgUnitId,
            contentType,
            title: title.trim(),
            notes: notes.trim() || null,
            assetUrl: assetUrl.trim() || null,
            ...(reason.trim() ? { reason: reason.trim() } : {}),
          },
          idempotencyKey,
        );
        onClose();
      }
    } catch (err) {
      handleMutationFailure(err);
    }
  };

  const handleQueueRelocation = async (event: FormEvent) => {
    event.preventDefault();
    if (!slot || !relocationReason.trim()) return;
    try {
      await onQueueRelocation(
        slot.id,
        {
          expectedVersion,
          relocationReason: relocationReason.trim(),
          ...(reason.trim() ? { reason: reason.trim() } : {}),
        },
        createIdempotencyKey(),
      );
      onClose();
    } catch (err) {
      handleMutationFailure(err);
    }
  };

  const handleOverrideSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!slot || !title.trim() || !reason.trim()) return;
    try {
      await onOverride(
        {
          postDate: selectedDate,
          orgUnitId,
          contentType,
          title: title.trim(),
          notes: notes.trim() || null,
          assetUrl: assetUrl.trim() || null,
          reason: reason.trim(),
          expectedOccupantVersion: slot.version,
        },
        createIdempotencyKey(),
      );
      onClose();
    } catch (err) {
      handleMutationFailure(err);
    }
  };

  const handleCopySummary = async () => {
    if (!slot) return;
    const summaryLines = [
      `NVMSA Content Schedule — ${dayLabel}`,
      `Unit: ${slot.orgUnitId}`,
      `Format: ${slot.contentType}`,
      `Title: ${slot.title}`,
      ...(slot.assetUrl ? [`Asset: ${slot.assetUrl}`] : []),
    ];
    await navigator.clipboard?.writeText(summaryLines.join('\n'));
    setCopiedSummary(true);
    window.setTimeout(() => setCopiedSummary(false), 1800);
  };

  return (
    <BottomSheet
      open={Boolean(selectedDate)}
      title={slot ? slot.title : `Open Day · ${dayLabel}`}
      subtitle={`${dayLabel} · Africa/Cairo (1 post/day policy)`}
      onClose={onClose}
    >
      <div className="space-y-4">
        {conflictInfo && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 space-y-2">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div>
                <p className="font-bold">This day was just booked</p>
                <p className="mt-0.5">
                  Occupied by <strong>{conflictInfo.winner.orgUnitId}</strong>:{' '}
                  {conflictInfo.winner.title}
                </p>
              </div>
            </div>
            {conflictInfo.nextOpenDate && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onSelectDate(conflictInfo.nextOpenDate as string)}
              >
                Jump to next open day ({conflictInfo.nextOpenDate})
              </Button>
            )}
          </div>
        )}

        {staleLatest && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900 space-y-2">
            <p className="font-bold">Updated concurrently (v{staleLatest.version})</p>
            <p>
              Latest title: <strong>{staleLatest.title}</strong> ({staleLatest.orgUnitId})
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setTitle(staleLatest.title);
                setOrgUnitId(staleLatest.orgUnitId);
                setContentType(staleLatest.contentType);
                setNotes(staleLatest.notes ?? '');
                setAssetUrl(staleLatest.assetUrl ?? '');
                setExpectedVersion(staleLatest.version);
                setStaleLatest(null);
                setIdempotencyKey(createIdempotencyKey());
              }}
            >
              Reload latest version
            </Button>
          </div>
        )}

        {slot && !canEdit ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={slotPalette.badgeClass}>{slot.orgUnitId}</Badge>
              <Badge>{slot.contentType}</Badge>
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">Booked</Badge>
            </div>
            <div className="space-y-1.5 rounded-xl bg-slate-50 p-3.5 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{slotUnit?.name ?? slot.orgUnitId}</p>
              <p className="text-xs text-slate-600">
                Seat: {slot.ownerSeatCode} · Booked by {slot.creatorName}
              </p>
              {isManagedSlot(slot) && slot.notes && (
                <p dir="auto" className="pt-1.5 text-xs text-slate-700">
                  {slot.notes}
                </p>
              )}
              {slot.assetUrl && (
                <a
                  href={slot.assetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-teal-700 underline"
                >
                  Open Asset Link <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => void handleCopySummary()}>
                {copiedSummary ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedSummary ? 'Copied' : 'Copy Summary'}
              </Button>
              {user && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowHistory((prev) => !prev)}
                >
                  <History className="h-3.5 w-3.5" />
                  History
                </Button>
              )}
            </div>
            {showHistory && user && <SlotAuditTimeline slotId={slot.id} />}
          </div>
        ) : !slot && !user ? (
          <div className="space-y-3 py-2 text-center">
            <p className="text-sm font-bold text-slate-900">This Cairo date is open</p>
            <p className="text-xs text-slate-600">
              Sign in with your official NVMSA Google account to book {dayLabel} for your
              committee or division.
            </p>
            <Button
              size="sm"
              onClick={() => {
                sessionStorage.setItem(
                  DRAFT_STORAGE_KEY,
                  JSON.stringify({
                    postDate: selectedDate,
                    orgUnitId,
                    contentType,
                    title,
                    notes,
                    assetUrl,
                  }),
                );
                void signInWithGoogle();
              }}
            >
              Sign In with Google to Book
            </Button>
          </div>
        ) : blockedPastBooking ? (
          <div className="space-y-2 py-2 text-center">
            <p className="text-sm font-bold text-slate-900">Past Date Locked</p>
            <p className="text-xs text-slate-600">
              Non-privileged seats cannot create new bookings on past Cairo dates ({selectedDate}).
            </p>
          </div>
        ) : showOverrideForm && slot && canOverride ? (
          <form onSubmit={handleOverrideSubmit} className="space-y-3">
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
              Overriding moves <strong>{slot.title}</strong> ({slot.orgUnitId}) to the Relocation
              Queue atomically and places your new post on {selectedDate}.
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">New Post Title</label>
              <input
                dir="auto"
                type="text"
                required
                minLength={3}
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Org Unit</label>
                <OrgUnitPicker
                  permittedUnits={permittedUnits}
                  value={orgUnitId}
                  onChange={setOrgUnitId}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Content Type</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as ContentType)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  {CONTENT_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Mandatory Override Reason
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={280}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why the existing slot is being displaced..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isBusy} className="flex-1">
                Confirm Atomic Override
              </Button>
              <Button variant="secondary" onClick={() => setShowOverrideForm(false)}>
                Back
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Post Title
                </label>
                <input
                  dir="auto"
                  type="text"
                  required
                  minLength={3}
                  maxLength={120}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setIdempotencyKey(createIdempotencyKey());
                  }}
                  placeholder="e.g., World Health Day Awareness Campaign"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Committee / Division
                  </label>
                  <OrgUnitPicker
                    permittedUnits={permittedUnits}
                    value={orgUnitId}
                    onChange={(next) => {
                      setOrgUnitId(next);
                      setIdempotencyKey(createIdempotencyKey());
                    }}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Content Type
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => {
                      setContentType(e.target.value as ContentType);
                      setIdempotencyKey(createIdempotencyKey());
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                  >
                    {CONTENT_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Asset Link (https:// optional)
                </label>
                <input
                  type="url"
                  value={assetUrl}
                  onChange={(e) => {
                    setAssetUrl(e.target.value);
                    setIdempotencyKey(createIdempotencyKey());
                  }}
                  placeholder="https://drive.google.com/..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Internal Notes (Seat Holders Only)
                </label>
                <textarea
                  dir="auto"
                  rows={2}
                  maxLength={500}
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setIdempotencyKey(createIdempotencyKey());
                  }}
                  placeholder="Publish time, caption instructions, or designer contact..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                />
              </div>

              {requiresSuperAdminReason && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Audit Reason (Required)
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={280}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for break-glass calendar edit..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              )}

              <Button type="submit" disabled={isBusy} className="w-full">
                {slot ? 'Save Changes' : 'Lock Post Slot'}
              </Button>
            </form>

            {slot && canEdit && (
              <div className="space-y-2.5 border-t border-slate-100 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => void handleCopySummary()}>
                    {copiedSummary ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copiedSummary ? 'Copied' : 'Copy Summary'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowHistory((prev) => !prev)}
                  >
                    <History className="h-3.5 w-3.5" />
                    Audit Log
                  </Button>
                  {canOverride && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setTitle('');
                        setShowOverrideForm(true);
                      }}
                    >
                      Override Slot
                    </Button>
                  )}
                </div>

                {showHistory && <SlotAuditTimeline slotId={slot.id} />}

                {confirmCancel ? (
                  <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
                    <p className="text-xs font-semibold text-red-900">
                      Cancel this booked slot? This immediately frees {selectedDate}.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={isBusy}
                        className="flex-1"
                        onClick={async () => {
                          await onCancel(
                            slot.id,
                            {
                              expectedVersion,
                              ...(reason.trim() ? { reason: reason.trim() } : {}),
                            },
                            createIdempotencyKey(),
                          );
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
                  <form
                    onSubmit={handleQueueRelocation}
                    className="space-y-2 rounded-xl bg-amber-50 p-3"
                  >
                    <label className="block text-xs font-semibold text-amber-900">
                      Reason for moving to Relocation Queue
                    </label>
                    <input
                      dir="auto"
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
      </div>
    </BottomSheet>
  );
}
