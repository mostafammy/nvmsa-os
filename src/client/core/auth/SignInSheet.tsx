import { useState } from 'react';
import { ExternalLink, ShieldAlert } from 'lucide-react';
import { TIER_LABELS } from '@shared/constants';
import { Badge } from '../../ui/Badge';
import { BottomSheet } from '../../ui/BottomSheet';
import { Button } from '../../ui/Button';
import { useSession } from './useSession';

interface SignInSheetProps {
  open: boolean;
  onClose: () => void;
}

const EMBEDDED_WEBVIEW_RE = /\b(WhatsApp|Instagram|FBAN|FBAV|Line|MicroMessenger)\b/i;

function isEmbeddedWebView(): boolean {
  if (typeof navigator === 'undefined') return false;
  return EMBEDDED_WEBVIEW_RE.test(navigator.userAgent);
}

export function SignInSheet({ open, onClose }: SignInSheetProps) {
  const { user, authOutcome, signInWithGoogle, signOut } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const embeddedWebView = isEmbeddedWebView();

  const handleGoogleSignIn = async () => {
    setError(null);
    setRedirecting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Google sign-in could not start. Confirm you used an official NVMSA seat account.',
      );
      setRedirecting(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      title={user ? 'Official Seat Session' : 'Sign In with Google'}
      subtitle={
        user
          ? 'Your session reflects your active D1 Official Seat.'
          : 'Members view the schedule freely. Official seat holders sign in to book or edit.'
      }
      onClose={onClose}
    >
      {user ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-900">{user.name}</p>
              <Badge className="bg-teal-50 text-teal-800 border-teal-200">
                {user.tier === 'super_admin' ? 'System' : user.seatCode}
              </Badge>
            </div>
            <p className="text-xs text-slate-600">{TIER_LABELS[user.tier]}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
            {user.allowedOrgUnits.length > 0 && (
              <p className="text-xs font-medium text-slate-700">
                Assigned Unit{user.allowedOrgUnits.length > 1 ? 's' : ''}:{' '}
                {user.allowedOrgUnits.join(', ')}
              </p>
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
            Sign Out & Clear Device Cache
          </Button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {authOutcome === 'seat_revoked' && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
              <div className="space-y-1">
                <p className="font-bold">Official seat inactive or reassigned</p>
                <p>
                  This email no longer holds an active NVMSA Official Seat. Choose the newly
                  appointed official Gmail account below.
                </p>
              </div>
            </div>
          )}

          {embeddedWebView && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex gap-2">
              <ExternalLink className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
              <div className="space-y-1">
                <p className="font-bold">Open in Safari or Chrome</p>
                <p>
                  Google blocks sign-in inside in-app browsers (WhatsApp, Instagram, Facebook).
                  Tap the menu button and choose <strong>Open in Browser</strong>.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <p className="text-xs leading-relaxed text-slate-600">
            Access to scheduling and governance requires an allowlisted official NVMSA Google
            account (e.g., <code className="text-slate-800">lpoo.nvmsa@gmail.com</code>,{' '}
            <code className="text-slate-800">pnsdd.nvmsa@gmail.com</code>).
          </p>

          <Button
            type="button"
            disabled={redirecting}
            onClick={() => void handleGoogleSignIn()}
            className="w-full"
          >
            {redirecting ? 'Redirecting to Google...' : 'Continue with Google'}
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}
