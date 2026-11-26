import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Users } from 'lucide-react';
import {
  ACCENT_PALETTE,
  ACCENT_TOKENS,
  resolveAccentPalette,
  type AccentToken,
} from '@shared/constants';
import type { OfficeSeatView, OrgUnit, OrgUnitKind } from '@shared/types';
import { useToast } from '../../../app/providers';
import { useSession } from '../../../core/auth/useSession';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import {
  adminKeys,
  createAdminOrgUnit,
  fetchAdminOrgUnits,
  fetchAdminSeats,
  updateAdminOrgUnit,
  updateAdminSeat,
} from '../api/admin.queries';

function SeatRowCard({
  seat,
  requiresReason,
  isBusy,
  onSave,
}: {
  seat: OfficeSeatView;
  requiresReason: boolean;
  isBusy: boolean;
  onSave: (
    seatCode: string,
    payload: { assignedEmail?: string; isActive?: boolean; reason?: string },
  ) => Promise<void>;
}) {
  const [email, setEmail] = useState(seat.assignedEmail);
  const [isActive, setIsActive] = useState(seat.isActive);
  const [reason, setReason] = useState('');
  const dirty = email.trim().toLowerCase() !== seat.assignedEmail || isActive !== seat.isActive;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!dirty) return;
    await onSave(seat.seatCode, {
      ...(email.trim().toLowerCase() !== seat.assignedEmail
        ? { assignedEmail: email.trim().toLowerCase() }
        : {}),
      ...(isActive !== seat.isActive ? { isActive } : {}),
      ...(reason.trim() ? { reason: reason.trim() } : {}),
    });
    setReason('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{seat.seatCode}</span>
            <Badge className="border-slate-200 bg-slate-100 text-slate-700">
              {seat.branch.replace('_', ' ')}
            </Badge>
            {!seat.isActive && (
              <Badge className="border-red-200 bg-red-50 text-red-700">Inactive</Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-600">{seat.title}</p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-500">
            Scope: {seat.allowedOrgUnits.join(', ') || 'All Units'}
          </p>
        </div>

        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
          />
          Active
        </label>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          aria-label={`Assigned Gmail for ${seat.seatCode}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
        />
        {requiresReason && (
          <input
            type="text"
            required={dirty}
            minLength={3}
            placeholder="Audit reason..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 sm:w-48"
          />
        )}
        <Button type="submit" size="sm" disabled={!dirty || isBusy}>
          Save Seat
        </Button>
      </div>
      {email.trim().toLowerCase() !== seat.assignedEmail && (
        <p className="text-[11px] font-medium text-amber-800">
          Saving revokes active login sessions for {seat.assignedEmail} immediately.
        </p>
      )}
    </form>
  );
}

function OrgUnitRowCard({
  unit,
  requiresReason,
  isBusy,
  onSave,
}: {
  unit: OrgUnit;
  requiresReason: boolean;
  isBusy: boolean;
  onSave: (
    id: string,
    payload: {
      name?: string;
      accentToken?: AccentToken;
      isActive?: boolean;
      reason?: string;
    },
  ) => Promise<void>;
}) {
  const [name, setName] = useState(unit.name);
  const [accentToken, setAccentToken] = useState<AccentToken>(unit.accentToken);
  const [isActive, setIsActive] = useState(unit.isActive);
  const [reason, setReason] = useState('');
  const palette = resolveAccentPalette(accentToken);
  const dirty =
    name.trim() !== unit.name || accentToken !== unit.accentToken || isActive !== unit.isActive;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!dirty) return;
    await onSave(unit.id, {
      ...(name.trim() !== unit.name ? { name: name.trim() } : {}),
      ...(accentToken !== unit.accentToken ? { accentToken } : {}),
      ...(isActive !== unit.isActive ? { isActive } : {}),
      ...(reason.trim() ? { reason: reason.trim() } : {}),
    });
    setReason('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge className={palette.badgeClass}>{unit.code}</Badge>
          <span className="text-xs font-medium text-slate-500">{unit.kind}</span>
        </div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
          />
          Active
        </label>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input
          type="text"
          required
          minLength={2}
          maxLength={120}
          aria-label={`Name for ${unit.code}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
        />
        <select
          aria-label={`Color token for ${unit.code}`}
          value={accentToken}
          onChange={(e) => setAccentToken(e.target.value as AccentToken)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
        >
          {ACCENT_TOKENS.map((token) => (
            <option key={token} value={token}>
              {ACCENT_PALETTE[token].label}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={!dirty || isBusy}>
          Save
        </Button>
      </div>
      {requiresReason && dirty && (
        <input
          type="text"
          required
          minLength={3}
          placeholder="Audit reason required..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
        />
      )}
    </form>
  );
}

export function AdminPage() {
  const { user } = useSession();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'seats' | 'units'>('seats');
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newKind, setNewKind] = useState<OrgUnitKind>('COMMITTEE');
  const [newAccent, setNewAccent] = useState<AccentToken>('teal');
  const [newReason, setNewReason] = useState('');

  const requiresReason = user?.tier === 'super_admin';

  const seatsQuery = useQuery({
    queryKey: adminKeys.seats,
    queryFn: fetchAdminSeats,
  });

  const unitsQuery = useQuery({
    queryKey: adminKeys.orgUnits,
    queryFn: fetchAdminOrgUnits,
  });

  const seatMutation = useMutation({
    mutationFn: ({
      seatCode,
      payload,
    }: {
      seatCode: string;
      payload: { assignedEmail?: string; isActive?: boolean; reason?: string };
    }) => updateAdminSeat(seatCode, payload),
    onSuccess: (updated) => {
      pushToast(`Updated ${updated.seatCode} (${updated.assignedEmail})`, 'success');
      void queryClient.invalidateQueries({ queryKey: adminKeys.seats });
    },
    onError: (err) => {
      pushToast(err instanceof Error ? err.message : 'Seat update failed', 'error');
    },
  });

  const updateUnitMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { name?: string; accentToken?: AccentToken; isActive?: boolean; reason?: string };
    }) => updateAdminOrgUnit(id, payload),
    onSuccess: (updated) => {
      pushToast(`Updated ${updated.code}`, 'success');
      void queryClient.invalidateQueries({ queryKey: adminKeys.orgUnits });
      void queryClient.invalidateQueries({ queryKey: ['calendar', 'month'] });
    },
    onError: (err) => {
      pushToast(err instanceof Error ? err.message : 'Org unit update failed', 'error');
    },
  });

  const createUnitMutation = useMutation({
    mutationFn: createAdminOrgUnit,
    onSuccess: (created) => {
      pushToast(`Added organization unit ${created.code}`, 'success');
      setNewCode('');
      setNewName('');
      setNewReason('');
      void queryClient.invalidateQueries({ queryKey: adminKeys.orgUnits });
      void queryClient.invalidateQueries({ queryKey: ['calendar', 'month'] });
    },
    onError: (err) => {
      pushToast(err instanceof Error ? err.message : 'Could not add org unit', 'error');
    },
  });

  const handleCreateUnit = async (event: FormEvent) => {
    event.preventDefault();
    await createUnitMutation.mutateAsync({
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      kind: newKind,
      accentToken: newAccent,
      isActive: true,
      ...(newReason.trim() ? { reason: newReason.trim() } : {}),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <ShieldCheck className="h-4 w-4 text-teal-700" />
          <span className="font-semibold">
            Managing as {user?.tier === 'super_admin' ? 'System' : user?.seatCode}
          </span>
        </div>

        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setTab('seats')}
            className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-bold ${
              tab === 'seats' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Official Seats ({seatsQuery.data?.length ?? 13})
          </button>
          <button
            type="button"
            onClick={() => setTab('units')}
            className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-bold ${
              tab === 'units' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Org Units ({unitsQuery.data?.length ?? 11})
          </button>
        </div>
      </div>

      {tab === 'seats' ? (
        <section className="space-y-3">
          {seatsQuery.isLoading ? (
            <div className="rounded-2xl bg-white p-6 text-center text-xs text-slate-500">
              Loading official seats...
            </div>
          ) : (
            seatsQuery.data?.map((seat) => (
              <SeatRowCard
                key={seat.seatCode}
                seat={seat}
                requiresReason={requiresReason}
                isBusy={seatMutation.isPending}
                onSave={async (seatCode, payload) => {
                  await seatMutation.mutateAsync({ seatCode, payload });
                }}
              />
            ))
          )}
        </section>
      ) : (
        <section className="space-y-4">
          <form
            onSubmit={handleCreateUnit}
            className="space-y-3 rounded-2xl border border-teal-200 bg-white p-4 shadow-2xs"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Users className="h-4 w-4 text-teal-700" />
              <span>Add Organization Unit</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
              <input
                type="text"
                required
                minLength={2}
                maxLength={24}
                placeholder="Code (e.g. FSD)"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
              />
              <input
                type="text"
                required
                minLength={2}
                maxLength={120}
                placeholder="Full Unit Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 sm:col-span-2"
              />
              <select
                aria-label="Organization unit kind"
                value={newKind}
                onChange={(e) => setNewKind(e.target.value as OrgUnitKind)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
              >
                <option value="COMMITTEE">Committee</option>
                <option value="DIVISION">Division</option>
                <option value="BOARD">Board</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="New organization unit color"
                value={newAccent}
                onChange={(e) => setNewAccent(e.target.value as AccentToken)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
              >
                {ACCENT_TOKENS.map((token) => (
                  <option key={token} value={token}>
                    {ACCENT_PALETTE[token].label}
                  </option>
                ))}
              </select>
              {requiresReason && (
                <input
                  type="text"
                  required
                  minLength={3}
                  placeholder="Audit reason..."
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
                />
              )}
              <Button type="submit" size="sm" disabled={createUnitMutation.isPending}>
                Add Org Unit
              </Button>
            </div>
          </form>

          {unitsQuery.data?.map((unit) => (
            <OrgUnitRowCard
              key={unit.id}
              unit={unit}
              requiresReason={requiresReason}
              isBusy={updateUnitMutation.isPending}
              onSave={async (id, payload) => {
                await updateUnitMutation.mutateAsync({ id, payload });
              }}
            />
          ))}
        </section>
      )}
    </div>
  );
}
