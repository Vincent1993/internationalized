import { isDate, isValid, parseISO, toDate } from 'date-fns';
import type { DateInput } from './types';

function isIterableLocale(locale: unknown): locale is Iterable<string> {
  return Symbol.iterator in Object(locale ?? {});
}

export function normalizeLocale(locale?: string | string[]): string | string[] | undefined {
  if (!locale) {
    return undefined;
  }

  if (Array.isArray(locale)) {
    return locale;
  }

  if (typeof locale === 'string') {
    return locale.trim() === '' ? undefined : locale;
  }

  if (isIterableLocale(locale)) {
    return Array.from(locale).filter(Boolean);
  }

  return undefined;
}

export function normalizeDateInput(input: DateInput): Date | null {
  if (input == null) {
    return null;
  }

  if (isDate(input)) {
    return isValid(input) ? input : null;
  }

  if (typeof input === 'number') {
    const date = toDate(input);
    return isValid(date) ? date : null;
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      return null;
    }

    const isoParsed = parseISO(trimmed);
    if (isValid(isoParsed)) {
      return isoParsed;
    }

    const native = new Date(trimmed);
    return isValid(native) ? native : null;
  }

  try {
    const coerced = toDate(input as Date | number);
    return isValid(coerced) ? coerced : null;
  } catch {
    return null;
  }
}
