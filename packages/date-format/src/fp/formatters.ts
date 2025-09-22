import { compareAsc, endOfDay, startOfDay } from 'date-fns';
import { normalizeDateInput } from '../utils/date';
import type {
  DateInput,
  DateFormatter,
  UseDateFormatOptions,
  UseDateFormatResult,
  ResolvedDateFormatOptions,
} from '../core/types';
import { getMemoizedFormatter } from './memoize';
import { mergeOptionsWithDefaults, type FormatterDefaults } from './defaults';

export interface FormatDateRangeResult {
  /**
   * @description 区间格式化后的完整字符串结果。
   */
  formattedValue: string;
  /**
   * @description 起始时间的格式化结果，已按升序排列。
   */
  start: UseDateFormatResult;
  /**
   * @description 结束时间的格式化结果，已按升序排列。
   */
  end: UseDateFormatResult;
  /**
   * @description 本次格式化使用的解析后选项。
   */
  resolvedOptions: ResolvedDateFormatOptions;
  /**
   * @description 任意一端无效时为 `true`。
   */
  isInvalid: boolean;
}

function getFormatterWithOptions(options: UseDateFormatOptions): DateFormatter {
  return getMemoizedFormatter(options);
}

function formatResultWithDefaults<T extends keyof FormatterDefaults>(
  type: T,
  value: DateInput,
  userOptions: UseDateFormatOptions | undefined,
  forcedOptions: UseDateFormatOptions,
  transform?: (date: Date) => Date,
): UseDateFormatResult {
  const finalOptions = mergeOptionsWithDefaults(type, userOptions, forcedOptions);
  const formatter = getFormatterWithOptions(finalOptions);

  if (!transform) {
    return formatter.format(value);
  }

  const normalized = normalizeDateInput(value);
  if (!normalized) {
    return formatter.format(value);
  }

  return formatter.format(transform(normalized));
}

function formatStringWithDefaults<T extends keyof FormatterDefaults>(
  type: T,
  value: DateInput,
  userOptions: UseDateFormatOptions | undefined,
  forcedOptions: UseDateFormatOptions,
  transform?: (date: Date) => Date,
): string {
  return formatResultWithDefaults(type, value, userOptions, forcedOptions, transform).formattedValue;
}

function buildIntlFormatter(options: UseDateFormatOptions): {
  intlFormatter: Intl.DateTimeFormat;
  resolved: ResolvedDateFormatOptions;
} {
  const { locale = 'zh-CN', ...intlOptions } = options;
  const formatter = new Intl.DateTimeFormat(locale, intlOptions);
  const resolved = formatter.resolvedOptions();

  return {
    intlFormatter: formatter,
    resolved: {
      ...resolved,
      originalLocale: locale,
    },
  };
}

function sortDatesAscending(a: Date, b: Date): [Date, Date] {
  return compareAsc(a, b) <= 0 ? [a, b] : [b, a];
}

function formatRangeInternal(
  startInput: DateInput,
  endInput: DateInput,
  userOptions: UseDateFormatOptions | undefined,
  forcedOptions: UseDateFormatOptions,
): FormatDateRangeResult {
  const finalOptions = mergeOptionsWithDefaults('range', userOptions, forcedOptions);
  const formatter = getFormatterWithOptions(finalOptions);

  const normalizedStart = normalizeDateInput(startInput);
  const normalizedEnd = normalizeDateInput(endInput);

  if (!normalizedStart || !normalizedEnd) {
    const invalidResult: FormatDateRangeResult = {
      formattedValue: 'Invalid Date Range',
      start: formatter.format(startInput),
      end: formatter.format(endInput),
      resolvedOptions: formatter.resolveOptions(),
      isInvalid: true,
    };
    return invalidResult;
  }

  const [startDate, endDate] = sortDatesAscending(normalizedStart, normalizedEnd);
  const start = formatter.format(startDate);
  const end = formatter.format(endDate);

  const { intlFormatter, resolved } = buildIntlFormatter(finalOptions);

  let formattedValue: string;
  if (typeof intlFormatter.formatRange === 'function') {
    formattedValue = intlFormatter.formatRange(startDate, endDate);
  } else {
    formattedValue = `${start.formattedValue} – ${end.formattedValue}`;
  }

  return {
    formattedValue,
    start,
    end,
    resolvedOptions: resolved,
    isInvalid: false,
  };
}

export function formatAsDate(
  value: DateInput,
  options?: UseDateFormatOptions,
): string {
  return formatStringWithDefaults('date', value, options, { dateStyle: 'short' });
}

export function formatAsDateEx(
  value: DateInput,
  options?: UseDateFormatOptions,
): UseDateFormatResult {
  return formatResultWithDefaults('date', value, options, { dateStyle: 'short' });
}

export function formatAsTime(
  value: DateInput,
  options?: UseDateFormatOptions,
): string {
  return formatStringWithDefaults('time', value, options, { timeStyle: 'short' });
}

export function formatAsTimeEx(
  value: DateInput,
  options?: UseDateFormatOptions,
): UseDateFormatResult {
  return formatResultWithDefaults('time', value, options, { timeStyle: 'short' });
}

export function formatAsDateTime(
  value: DateInput,
  options?: UseDateFormatOptions,
): string {
  return formatStringWithDefaults('dateTime', value, options, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function formatAsDateTimeEx(
  value: DateInput,
  options?: UseDateFormatOptions,
): UseDateFormatResult {
  return formatResultWithDefaults('dateTime', value, options, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function formatAsDateTimeWithSeconds(
  value: DateInput,
  options?: UseDateFormatOptions,
): string {
  return formatStringWithDefaults('dateTimeWithSeconds', value, options, {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
}

export function formatAsDateTimeWithSecondsEx(
  value: DateInput,
  options?: UseDateFormatOptions,
): UseDateFormatResult {
  return formatResultWithDefaults('dateTimeWithSeconds', value, options, {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
}

export function formatAsWeekday(
  value: DateInput,
  options?: UseDateFormatOptions,
): string {
  return formatStringWithDefaults('weekday', value, options, { weekday: 'long' });
}

export function formatAsWeekdayEx(
  value: DateInput,
  options?: UseDateFormatOptions,
): UseDateFormatResult {
  return formatResultWithDefaults('weekday', value, options, { weekday: 'long' });
}

export function formatAsMonthDay(
  value: DateInput,
  options?: UseDateFormatOptions,
): string {
  return formatStringWithDefaults('monthDay', value, options, { month: 'long', day: 'numeric' });
}

export function formatAsMonthDayEx(
  value: DateInput,
  options?: UseDateFormatOptions,
): UseDateFormatResult {
  return formatResultWithDefaults('monthDay', value, options, {
    month: 'long',
    day: 'numeric',
  });
}

export function formatAsMonth(
  value: DateInput,
  options?: UseDateFormatOptions,
): string {
  return formatStringWithDefaults('month', value, options, { month: 'long' });
}

export function formatAsMonthEx(
  value: DateInput,
  options?: UseDateFormatOptions,
): UseDateFormatResult {
  return formatResultWithDefaults('month', value, options, { month: 'long' });
}

export function formatAsStartOfDay(
  value: DateInput,
  options?: UseDateFormatOptions,
): string {
  return formatStringWithDefaults(
    'dateTime',
    value,
    options,
    {
      dateStyle: 'short',
      timeStyle: 'short',
    },
    startOfDay,
  );
}

export function formatAsStartOfDayEx(
  value: DateInput,
  options?: UseDateFormatOptions,
): UseDateFormatResult {
  return formatResultWithDefaults(
    'dateTime',
    value,
    options,
    {
      dateStyle: 'short',
      timeStyle: 'short',
    },
    startOfDay,
  );
}

export function formatAsEndOfDay(
  value: DateInput,
  options?: UseDateFormatOptions,
): string {
  return formatStringWithDefaults(
    'dateTimeWithSeconds',
    value,
    options,
    {
      dateStyle: 'short',
      timeStyle: 'medium',
    },
    endOfDay,
  );
}

export function formatAsEndOfDayEx(
  value: DateInput,
  options?: UseDateFormatOptions,
): UseDateFormatResult {
  return formatResultWithDefaults(
    'dateTimeWithSeconds',
    value,
    options,
    {
      dateStyle: 'short',
      timeStyle: 'medium',
    },
    endOfDay,
  );
}

export function formatDateRange(
  start: DateInput,
  end: DateInput,
  options?: UseDateFormatOptions,
): string {
  return formatRangeInternal(start, end, options, { dateStyle: 'short' }).formattedValue;
}

export function formatDateRangeEx(
  start: DateInput,
  end: DateInput,
  options?: UseDateFormatOptions,
): FormatDateRangeResult {
  return formatRangeInternal(start, end, options, { dateStyle: 'short' });
}
