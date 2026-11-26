import { useEffect, useState } from 'react';
import { getTodayCairoDate } from '@shared/utils';

const CAIRO_TIME_PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Cairo',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

function msUntilNextCairoMidnight(now: Date): number {
  const parts = CAIRO_TIME_PARTS.formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  const second = Number(parts.find((p) => p.type === 'second')?.value ?? '0');
  const elapsedMs = ((hour * 60 + minute) * 60 + second) * 1000;
  return Math.max(1000, 24 * 60 * 60 * 1000 - elapsedMs + 500);
}

export function useCairoClock(serverTodayHint?: string): string {
  const [todayCairo, setTodayCairo] = useState<string>(() => getTodayCairoDate());

  useEffect(() => {
    if (serverTodayHint && serverTodayHint > todayCairo) {
      setTodayCairo(serverTodayHint);
    }
  }, [serverTodayHint, todayCairo]);

  useEffect(() => {
    let timerId: number | undefined;

    const syncAndSchedule = () => {
      const now = new Date();
      setTodayCairo(getTodayCairoDate(now));
      window.clearTimeout(timerId);
      timerId = window.setTimeout(syncAndSchedule, msUntilNextCairoMidnight(now));
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncAndSchedule();
      }
    };

    syncAndSchedule();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', syncAndSchedule);

    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', syncAndSchedule);
    };
  }, []);

  return todayCairo;
}
