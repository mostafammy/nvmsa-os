import { useState } from 'react';
import { ExternalLink, LogOut, ShieldAlert } from 'lucide-react';
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

// Official 4-colour Google "G" mark.
function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3.02h3.88c2.27-2.09 3.54-5.17 3.54-8.89Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.88-3.02c-1.07.72-2.45 1.15-4.05 1.15-3.12 0-5.76-2.11-6.71-4.94H1.28v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.28V6.61H1.28a12 12 0 0 0 0 10.78l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.78c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.28 6.61l4.01 3.11C6.24 6.89 8.88 4.78 12 4.78Z"
      />
    </svg>
  );
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
          <div className="space-y-2 rounded-2xl border border-line bg-paper p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[16px] font-medium text-ink">{user.name}</p>
              <Badge className="border-brand/25 bg-brand-soft text-brand-strong">
                {user.tier === 'super_admin' ? 'System' : user.seatCode}
              </Badge>
            </div>
            <p className="text-[14px] text-ink-soft">{TIER_LABELS[user.tier]}</p>
            <p className="font-mono text-[13px] text-muted">{user.email}</p>
            {user.allowedOrgUnits.length > 0 && (
              <p className="pt-1 text-[13px] font-medium text-ink-soft">
                Assigned Unit{user.allowedOrgUnits.length > 1 ? 's' : ''}:{' '}
                <span className="font-mono">{user.allowedOrgUnits.join(', ')}</span>
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
            <LogOut className="h-4 w-4" />
            Sign Out &amp; Clear Device Cache
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {authOutcome === 'seat_revoked' && (
            <div
              role="alert"
              className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-[13px] text-amber-950"
            >
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />
              <div className="space-y-1">
                <p className="font-medium">Official seat inactive or reassigned</p>
                <p className="leading-relaxed">
                  This email no longer holds an active NVMSA Official Seat. Choose the newly
                  appointed official Gmail account below.
                </p>
              </div>
            </div>
          )}

          {embeddedWebView && (
            <div className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-[13px] text-amber-950">
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />
              <div className="space-y-1">
                <p className="font-medium">Open in Safari or Chrome</p>
                <p className="leading-relaxed">
                  Google blocks sign-in inside in-app browsers (WhatsApp, Instagram, Facebook).
                  Tap the menu button and choose <strong>Open in Browser</strong>.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-800"
            >
              {error}
            </div>
          )}

          <p className="text-[14px] leading-relaxed text-ink-soft">
            Scheduling and governance require an allowlisted official NVMSA Google account (such as{' '}
            <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-ink">
              lpoo.nvmsa@gmail.com
            </code>{' '}
            or{' '}
            <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-ink">
              pnsdd.nvmsa@gmail.com
            </code>
            ).
          </p>

          <Button
            type="button"
            variant="secondary"
            disabled={redirecting}
            onClick={() => void handleGoogleSignIn()}
            className="w-full bg-surface font-medium text-ink shadow-[0_1px_2px_rgb(20_32_30/0.06)]"
          >
            <GoogleMark />
            <span>{redirecting ? 'Redirecting to Google...' : 'Continue with Google'}</span>
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}
