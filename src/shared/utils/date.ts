export const CAIRO_TIMEZONE = 'Africa/Cairo';
export const FIXED_CALENDAR_GRID_CELLS = 42;
export const MIN_CALENDAR_YEAR = 2020;
export const MAX_CALENDAR_YEAR = 2100;

const cairoDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CAIRO_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function getTodayCairoDate(now: Date = new Date()): string {
  return cairoDateFormatter.format(now);
}

export const getCairoTodayIso = getTodayCairoDate;

export function getCurrentCairoMonth(now: Date = new Date()): string {
  return getTodayCairoDate(now).slice(0, 7);
}

export function isValidYearMonth(value: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    return false;
  }
  const [yearStr, monthStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    year >= MIN_CALENDAR_YEAR &&
    year <= MAX_CALENDAR_YEAR &&
    month >= 1 &&
    month <= 12
  );
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (year < MIN_CALENDAR_YEAR || year > MAX_CALENDAR_YEAR || month < 1 || month > 12) {
    return false;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isPastCairoDate(isoDate: string, todayCairo: string = getTodayCairoDate()): boolean {
  return isoDate < todayCairo;
}

export function addDaysIsoDate(isoDate: string, deltaDays: number): string {
  const [yearStr, monthStr, dayStr] = isoDate.split('-');
  const date = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr) + deltaDays));
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthDateBounds(yearMonth: string): { start: string; end: string } {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    start: `${yearMonth}-01`,
    end: `${yearMonth}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function shiftYearMonth(yearMonth: string, deltaMonths: number): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const date = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1 + deltaMonths, 1));
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export const addMonths = shiftYearMonth;

export function formatMonthHeading(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const date = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, 15));
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatShortDayLabel(isoDate: string): string {
  const [yearStr, monthStr, dayStr] = isoDate.split('-');
  const date = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr)));
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export interface CalendarGridCell {
  isoDate: string;
  dayNumber: number;
  inCurrentMonth: boolean;
}

/**
 * Generates a fixed 42-cell (6 x 7) Sunday-first calendar grid for a given YYYY-MM month
 * to prevent layout shift across month transitions.
 */
export function buildMonthGrid(yearMonth: string): CalendarGridCell[] {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);

  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startOffset = firstOfMonth.getUTCDay();

  const cells: CalendarGridCell[] = [];
  for (let i = 0; i < FIXED_CALENDAR_GRID_CELLS; i += 1) {
    const cellDate = new Date(Date.UTC(year, month - 1, 1 - startOffset + i));
    const cellYear = cellDate.getUTCFullYear();
    const cellMonth = cellDate.getUTCMonth() + 1;
    const cellDay = cellDate.getUTCDate();
    const isoDate = `${cellYear}-${String(cellMonth).padStart(2, '0')}-${String(cellDay).padStart(2, '0')}`;

    cells.push({
      isoDate,
      dayNumber: cellDay,
      inCurrentMonth: cellYear === year && cellMonth === month,
    });
  }

  return cells;
}

export function getGridDateBounds(yearMonth: string): { gridStart: string; gridEnd: string } {
  const cells = buildMonthGrid(yearMonth);
  const first = cells[0];
  const last = cells[cells.length - 1];
  if (!first || !last) {
    throw new Error(`Invalid month grid generated for ${yearMonth}`);
  }
  return {
    gridStart: first.isoDate,
    gridEnd: last.isoDate,
  };
}
