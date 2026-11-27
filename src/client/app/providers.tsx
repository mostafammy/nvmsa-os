import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../core/auth/useSession';

interface ToastItem {
  id: string;
  message: string;
  tone: 'info' | 'success' | 'error';
}

interface ToastContextValue {
  pushToast: (message: string, tone?: ToastItem['tone']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const id of timers) {
        window.clearTimeout(id);
      }
      timers.clear();
    };
  }, []);

  const pushToast = useCallback((message: string, tone: ToastItem['tone'] = 'info') => {
    const id = crypto.randomUUID().slice(0, 8);
    setToasts((prev) => [...prev.slice(-3), { id, message, tone }]);
    const timerId = window.setTimeout(() => {
      timersRef.current.delete(timerId);
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3500);
    timersRef.current.add(timerId);
  }, []);

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-8"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`animate-toast pointer-events-auto rounded-full border px-4 py-2.5 text-[13px] font-medium shadow-[0_18px_40px_-10px_rgb(0_0_0/0.8)] backdrop-blur-xl ${
              toast.tone === 'error'
                ? 'border-red-400/35 bg-red-700/95 text-white'
                : toast.tone === 'success'
                  ? 'border-brand-glow/35 bg-brand/95 text-white'
                  : 'border-line-strong bg-elevated/95 text-ink'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ServiceWorkerUpdateBanner() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    const handleSwWaiting = (event: Event) => {
      const custom = event as CustomEvent<ServiceWorker>;
      if (custom.detail) {
        setWaitingWorker(custom.detail);
      }
    };
    window.addEventListener('nvmsa-sw-waiting', handleSwWaiting);
    return () => window.removeEventListener('nvmsa-sw-waiting', handleSwWaiting);
  }, []);

  if (!waitingWorker) return null;

  return (
    <div
      role="status"
      className="animate-toast fixed inset-x-4 top-[72px] z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-full border border-brand-glow/35 bg-elevated/95 py-2 ps-4 pe-2 text-[13px] font-medium text-ink shadow-[0_18px_40px_-12px_rgb(0_0_0/0.85)] backdrop-blur-xl"
    >
      <span>A new NVMSA OS update is ready.</span>
      <button
        type="button"
        onClick={() => {
          waitingWorker.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }}
        className="press inline-flex min-h-11 cursor-pointer items-center rounded-full bg-brand px-4 text-[13px] font-medium text-white transition-colors hover:bg-brand-strong"
      >
        Reload
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside AppProviders');
  }
  return ctx;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <ServiceWorkerUpdateBanner />
          {children}
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
