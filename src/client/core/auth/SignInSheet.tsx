import { useState, type FormEvent } from 'react';
import { ROLE_LABELS } from '@shared/constants';
import { Badge } from '../../ui/Badge';
import { BottomSheet } from '../../ui/BottomSheet';
import { Button } from '../../ui/Button';
import { useSession } from './useSession';

interface SignInSheetProps {
  open: boolean;
  onClose: () => void;
}

export function SignInSheet({ open, onClose }: SignInSheetProps) {
  const { user, signIn, signOut } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn({ email: email.trim(), password });
      setPassword('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      title={user ? 'Account' : 'EB / Admin Sign In'}
      subtitle={
        user
          ? 'Manage your NVMSA OS session'
          : 'Officers can browse the calendar without signing in.'
      }
      onClose={onClose}
    >
      {user ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-900">{user.name}</p>
              <Badge className="bg-teal-50 text-teal-800 border-teal-200">
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">{user.email}</p>
            {user.entityCode && (
              <p className="text-xs font-medium text-slate-600">Entity: {user.entityCode}</p>
            )}
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={async () => {
              await signOut();
              onClose();
            }}
          >
            Sign Out
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@nvmsa.org"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      )}
    </BottomSheet>
  );
}
