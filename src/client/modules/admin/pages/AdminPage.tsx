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

function ActiveToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-[13px] font-medium text-ink-soft select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-glow ${
          checked ? 'border-brand-glow/55 bg-brand' : 'border-line-strong bg-sunken'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-xs transition-transform duration-200 ease-[var(--ease-enter)] ${
            checked ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </span>
      <span>Active</span>
    </label>
  );
}

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
    <form onSubmit={handleSubmit} className="panel space-y-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[15px] font-medium text-ink">{seat.seatCode}</span>
            <Badge>{seat.branch.replace('_', ' ')}</Badge>
            {!seat.isActive && (
              <Badge className="border-red-400/35 bg-red-500/20 text-red-200">Inactive</Badge>
            )}
          </div>
          <p className="mt-1 text-[14px] text-ink-soft">{seat.title}</p>
          <p className="mt-0.5 text-[13px] text-muted">
            Scope:{' '}
            <span className="font-mono text-brand-text">
              {seat.allowedOrgUnits.join(', ') || 'All Units'}
            </span>
          </p>
        </div>

        <ActiveToggle
          checked={isActive}
          onChange={setIsActive}
          label={`Toggle ${seat.seatCode} active`}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          aria-label={`Assigned Gmail for ${seat.seatCode}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field flex-1"
        />
        {requiresReason && (
          <input
            type="text"
            required={dirty}
            minLength={3}
            placeholder="Audit reason..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="field sm:w-52"
          />
        )}
        <Button type="submit" size="sm" disabled={!dirty || isBusy}>
          Save Seat
        </Button>
      </div>
      {email.trim().toLowerCase() !== seat.assignedEmail && (
        <p className="text-[13px] font-medium text-amber-200">
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
      className="panel relative space-y-3 overflow-hidden p-4 sm:p-5"
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 start-0 w-1 ${palette.dotClass}`}
      />
      <div className="flex items-center justify-between gap-2 ps-1">
        <div className="flex items-center gap-2">
          <Badge className={palette.badgeClass}>{unit.code}</Badge>
          <span className="font-mono text-[12px] text-muted">{unit.kind}</span>
        </div>
        <ActiveToggle
          checked={isActive}
          onChange={setIsActive}
          label={`Toggle ${unit.code} active`}
        />
      </div>

      <div className="grid grid-cols-1 gap-2 ps-1 sm:grid-cols-[1fr_auto_auto]">
        <input
          type="text"
          required
          minLength={2}
          maxLength={120}
          aria-label={`Name for ${unit.code}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="field"
        />
        <select
          aria-label={`Color token for ${unit.code}`}
          value={accentToken}
          onChange={(e) => setAccentToken(e.target.value as AccentToken)}
          className="field"
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
        <div className="ps-1">
          <input
            type="text"
            required
            minLength={3}
            placeholder="Audit reason required..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="field"
          />
        </div>
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
    <div className="animate-enter mx-auto max-w-5xl space-y-4 sm:space-y-5">
      <div className="panel flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2.5 text-[14px] text-ink-soft">
          <ShieldCheck className="h-5 w-5 text-brand-text" />
          <span className="font-medium">
            Managing as{' '}
            <span className="font-mono text-brand-text">
              {user?.tier === 'super_admin' ? 'System' : user?.seatCode}
            </span>
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Governance sections"
          className="relative inline-grid grid-cols-2 rounded-full border border-line bg-sunken p-1"
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-1 start-1 w-[calc(50%-0.25rem)] rounded-full bg-brand shadow-[0_0_18px_-6px_rgb(45_212_191/0.75)] transition-transform duration-[240ms] ease-[var(--ease-enter)]"
            style={{ transform: tab === 'units' ? 'translateX(100%)' : 'translateX(0%)' }}
          />
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'seats'}
            onClick={() => setTab('seats')}
            className={`relative z-10 min-h-11 cursor-pointer rounded-full px-4 text-[13px] font-medium transition-colors ${
              tab === 'seats' ? 'text-white' : 'text-muted hover:text-ink'
            }`}
          >
            Official Seats ({seatsQuery.data?.length ?? 13})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'units'}
            onClick={() => setTab('units')}
            className={`relative z-10 min-h-11 cursor-pointer rounded-full px-4 text-[13px] font-medium transition-colors ${
              tab === 'units' ? 'text-white' : 'text-muted hover:text-ink'
            }`}
          >
            Org Units ({unitsQuery.data?.length ?? 11})
          </button>
        </div>
      </div>

      {tab === 'seats' ? (
        <section className="space-y-3">
          {seatsQuery.isLoading ? (
            <div className="space-y-3" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="panel space-y-3 p-5">
                  <div className="skeleton h-5 w-36" />
                  <div className="skeleton h-11 w-full" />
                </div>
              ))}
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
            className="panel-glow space-y-3.5 p-4 sm:p-5"
          >
            <div className="flex items-center gap-2 text-[15px] font-medium text-ink">
              <Users className="h-4 w-4 text-brand-text" />
              <span>Add Organization Unit</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
              <input
                type="text"
                required
                minLength={2}
                maxLength={24}
                aria-label="Unit code"
                placeholder="Code (e.g. FSD)"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className="field"
              />
              <input
                type="text"
                required
                minLength={2}
                maxLength={120}
                aria-label="Full unit name"
                placeholder="Full Unit Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="field sm:col-span-2"
              />
              <select
                aria-label="Organization unit kind"
                value={newKind}
                onChange={(e) => setNewKind(e.target.value as OrgUnitKind)}
                className="field"
              >
                <option value="COMMITTEE">Committee</option>
                <option value="DIVISION">Division</option>
                <option value="BOARD">Board</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                aria-label="New organization unit color"
                value={newAccent}
                onChange={(e) => setNewAccent(e.target.value as AccentToken)}
                className="field sm:w-44"
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
                  aria-label="Audit reason"
                  placeholder="Audit reason..."
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="field flex-1"
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
