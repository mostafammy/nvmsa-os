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
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl px-4 py-2.5 text-xs font-semibold shadow-lg ${
              toast.tone === 'error'
                ? 'bg-red-700 text-white'
                : toast.tone === 'success'
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-900 text-white'
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
    <div className="fixed inset-x-0 top-16 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-900 px-4 py-2.5 text-xs text-white shadow-lg">
      <span>A new NVMSA OS update is ready.</span>
      <button
        type="button"
        onClick={() => {
          waitingWorker.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }}
        className="cursor-pointer rounded-lg bg-white px-2.5 py-1 font-bold text-teal-900 hover:bg-teal-50"
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
