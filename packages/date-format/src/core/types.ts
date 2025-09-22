import type { ReactNode } from 'react';
import type { DateInput } from '../utils/types';

export interface DateFormatContextValue extends Intl.DateTimeFormatOptions {
  locale?: string | string[];
}

export interface DateFormatProviderProps {
  children: ReactNode;
  options?: DateFormatContextValue;
}

export interface UseDateFormatOptions extends Intl.DateTimeFormatOptions {
  locale?: string | string[];
}

export interface CreateDateFormatOptions extends UseDateFormatOptions {
  contextDefaults?: DateFormatContextValue | null;
}

export interface ResolvedDateFormatOptions extends Intl.ResolvedDateTimeFormatOptions {
  originalLocale?: string | string[];
}

export interface UseDateFormatResult {
  formattedValue: string;
  parts: Intl.DateTimeFormatPart[];
  date: Date | null;
  resolvedOptions: ResolvedDateFormatOptions;
  isInvalid: boolean;
}

export interface DateFormatter {
  format(value: DateInput, overrideOptions?: UseDateFormatOptions): UseDateFormatResult;
  resolveOptions(overrideOptions?: UseDateFormatOptions): ResolvedDateFormatOptions;
}

export type { DateInput };
