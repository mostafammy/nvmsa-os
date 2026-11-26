import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Check, Copy, ExternalLink, History, Lock, ShieldAlert } from 'lucide-react';
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
  id,
  permittedUnits,
  value,
  onChange,
}: {
  id: string;
  permittedUnits: OrgUnit[];
  value: string;
  onChange: (nextUnitId: string) => void;
}) {
  if (permittedUnits.length <= 1) {
    const only = permittedUnits[0];
    const palette = resolveAccentPalette(only?.accentToken);
    return (
      <div className="flex min-h-11 items-center rounded-[14px] border border-line bg-paper px-3.5">
        <Badge className={palette.badgeClass}>{only?.code ?? value}</Badge>
      </div>
    );
  }

  if (permittedUnits.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1.5 rounded-[14px] border border-line bg-sunken p-1">
        {permittedUnits.map((unit) => {
          const active = value === unit.id;
          return (
            <button
              key={unit.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(unit.id)}
              className={`min-h-10 cursor-pointer rounded-[10px] text-[13px] font-medium transition-colors ${
                active
                  ? 'bg-ink text-paper shadow-[0_1px_2px_rgb(20_32_30/0.14)]'
                  : 'text-ink-soft hover:bg-surface/70 hover:text-ink'
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
      id={id}
      aria-label="Committee or Division"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="field"
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
    return (
      <div className="space-y-2" aria-busy="true">
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-14 w-full" />
      </div>
    );
  }
  if (!history || history.length === 0) {
    return <p className="text-[13px] text-muted">No audit entries recorded yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {history.map((entry) => (
        <li
          key={entry.id}
          className="rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[13px]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[12px] font-medium text-ink">{entry.action}</span>
            <span className="font-mono text-[12px] text-muted">
              {new Date(entry.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-ink-soft">
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
          <div
            role="alert"
            className="space-y-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-[13px] text-amber-950"
          >
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />
              <div>
                <p className="font-medium">This day was just booked</p>
                <p className="mt-0.5 leading-relaxed">
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
          <div
            role="alert"
            className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-900"
          >
            <p className="font-medium">Updated concurrently (v{staleLatest.version})</p>
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
              <Badge>{slot.contentType.replace('_', ' ')}</Badge>
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-900">Booked</Badge>
            </div>
            <div className="space-y-2 rounded-2xl border border-line bg-paper p-4 text-[14px] text-ink-soft">
              <p className="font-medium text-ink">{slotUnit?.name ?? slot.orgUnitId}</p>
              <p className="text-[13px] text-muted">
                Seat: <span className="font-mono text-ink-soft">{slot.ownerSeatCode}</span> · Booked
                by {slot.creatorName}
              </p>
              {isManagedSlot(slot) && slot.notes && (
                <p dir="auto" className="border-t border-line pt-2.5 text-[14px] leading-relaxed text-ink-soft">
                  {slot.notes}
                </p>
              )}
              {slot.assetUrl && (
                <a
                  href={slot.assetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-medium text-brand underline decoration-brand/40 underline-offset-4 hover:decoration-brand"
                >
                  Open Asset Link <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => void handleCopySummary()}>
                {copiedSummary ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedSummary ? 'Copied' : 'Copy Summary'}
              </Button>
              {user && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowHistory((prev) => !prev)}
                >
                  <History className="h-4 w-4" />
                  History
                </Button>
              )}
            </div>
            {showHistory && user && <SlotAuditTimeline slotId={slot.id} />}
          </div>
        ) : !slot && !user ? (
          <div className="flex flex-col items-center space-y-3 py-3 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <CalendarDays className="h-6 w-6" />
            </div>
            <p className="text-[16px] font-medium text-ink">This Cairo date is open</p>
            <p className="max-w-sm text-[14px] leading-relaxed text-muted">
              Sign in with your official NVMSA Google account to book {dayLabel} for your
              committee or division.
            </p>
            <Button
              className="mt-1 w-full sm:w-auto"
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
          <div className="flex flex-col items-center space-y-2.5 py-4 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sunken text-ink-soft">
              <Lock className="h-5 w-5" />
            </div>
            <p className="text-[16px] font-medium text-ink">Past Date Locked</p>
            <p className="max-w-sm text-[14px] leading-relaxed text-muted">
              Non-privileged seats cannot create new bookings on past Cairo dates ({selectedDate}).
            </p>
          </div>
        ) : showOverrideForm && slot && canOverride ? (
          <form onSubmit={handleOverrideSubmit} className="space-y-4">
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-[13px] leading-relaxed text-amber-950">
              Overriding moves <strong>{slot.title}</strong> ({slot.orgUnitId}) to the Relocation
              Queue atomically and places your new post on {selectedDate}.
            </div>
            <div>
              <label htmlFor="override-title" className="field-label">
                New Post Title
              </label>
              <input
                id="override-title"
                dir="auto"
                type="text"
                required
                minLength={3}
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="field"
              />
            </div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="override-unit" className="field-label">
                  Org Unit
                </label>
                <OrgUnitPicker
                  id="override-unit"
                  permittedUnits={permittedUnits}
                  value={orgUnitId}
                  onChange={setOrgUnitId}
                />
              </div>
              <div>
                <label htmlFor="override-type" className="field-label">
                  Content Type
                </label>
                <select
                  id="override-type"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as ContentType)}
                  className="field"
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
              <label htmlFor="override-reason" className="field-label">
                Mandatory Override Reason
              </label>
              <input
                id="override-reason"
                type="text"
                required
                minLength={3}
                maxLength={280}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why the existing slot is being displaced..."
                className="field"
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="slot-title" className="field-label">
                  Post Title
                </label>
                <input
                  id="slot-title"
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
                  className="field"
                />
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label htmlFor="slot-unit" className="field-label">
                    Committee / Division
                  </label>
                  <OrgUnitPicker
                    id="slot-unit"
                    permittedUnits={permittedUnits}
                    value={orgUnitId}
                    onChange={(next) => {
                      setOrgUnitId(next);
                      setIdempotencyKey(createIdempotencyKey());
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="slot-type" className="field-label">
                    Content Type
                  </label>
                  <select
                    id="slot-type"
                    value={contentType}
                    onChange={(e) => {
                      setContentType(e.target.value as ContentType);
                      setIdempotencyKey(createIdempotencyKey());
                    }}
                    className="field"
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
                <label htmlFor="slot-asset" className="field-label">
                  Asset Link (https:// optional)
                </label>
                <input
                  id="slot-asset"
                  type="url"
                  value={assetUrl}
                  onChange={(e) => {
                    setAssetUrl(e.target.value);
                    setIdempotencyKey(createIdempotencyKey());
                  }}
                  placeholder="https://drive.google.com/..."
                  className="field"
                />
              </div>

              <div>
                <label htmlFor="slot-notes" className="field-label">
                  Internal Notes (Seat Holders Only)
                </label>
                <textarea
                  id="slot-notes"
                  dir="auto"
                  rows={2}
                  maxLength={500}
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setIdempotencyKey(createIdempotencyKey());
                  }}
                  placeholder="Publish time, caption instructions, or designer contact..."
                  className="field"
                />
              </div>

              {requiresSuperAdminReason && (
                <div>
                  <label htmlFor="slot-audit-reason" className="field-label">
                    Audit Reason (Required)
                  </label>
                  <input
                    id="slot-audit-reason"
                    type="text"
                    required
                    minLength={3}
                    maxLength={280}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for break-glass calendar edit..."
                    className="field"
                  />
                </div>
              )}

              <Button type="submit" disabled={isBusy} className="w-full">
                {slot ? 'Save Changes' : 'Lock Post Slot'}
              </Button>
            </form>

            {slot && canEdit && (
              <div className="space-y-3 border-t border-line pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => void handleCopySummary()}>
                    {copiedSummary ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedSummary ? 'Copied' : 'Copy Summary'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowHistory((prev) => !prev)}
                  >
                    <History className="h-4 w-4" />
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
                  <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                    <p className="text-[13px] font-medium text-red-900">
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
                    className="space-y-3 rounded-2xl border border-amber-300 bg-amber-50 p-4"
                  >
                    <label htmlFor="relocate-reason" className="field-label !text-amber-950">
                      Reason for moving to Relocation Queue
                    </label>
                    <input
                      id="relocate-reason"
                      dir="auto"
                      type="text"
                      required
                      minLength={3}
                      maxLength={280}
                      value={relocationReason}
                      onChange={(e) => setRelocationReason(e.target.value)}
                      placeholder="e.g., Waiting for final poster approval"
                      className="field"
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
