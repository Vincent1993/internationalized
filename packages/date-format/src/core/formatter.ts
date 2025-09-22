import { normalizeDateInput, normalizeLocale } from '../utils/date';
import type {
  CreateDateFormatOptions,
  DateFormatter,
  DateFormatContextValue,
  ResolvedDateFormatOptions,
  UseDateFormatOptions,
  UseDateFormatResult,
} from './types';
import type { DateInput } from '../utils/types';

interface MergeResult {
  locale?: string | string[];
  intlOptions: Intl.DateTimeFormatOptions;
  originalLocale?: string | string[];
}

function ensureLocale(locale?: string | string[] | null): string | string[] {
  const normalized = normalizeLocale(locale ?? undefined);
  return normalized ?? 'zh-CN';
}

type PartialOptionSource = UseDateFormatOptions | DateFormatContextValue | null | undefined;

function splitOptions(source: PartialOptionSource): MergeResult {
  if (!source) {
    return { intlOptions: {} };
  }

  const { locale, ...intlOptions } = source;

  return {
    locale: locale ? normalizeLocale(locale) : undefined,
    intlOptions: { ...intlOptions },
    originalLocale: locale ? normalizeLocale(locale) : undefined,
  };
}

function mergeOptions(
  contextOptions?: PartialOptionSource,
  baseOptions?: PartialOptionSource,
  overrideOptions?: PartialOptionSource,
): MergeResult {
  const merged: MergeResult = { intlOptions: {} };
  const sources: MergeResult[] = [
    splitOptions(contextOptions),
    splitOptions(baseOptions),
    splitOptions(overrideOptions),
  ];

  for (const source of sources) {
    if (source.locale !== undefined) {
      merged.locale = source.locale;
      merged.originalLocale = source.originalLocale;
    }

    Object.assign(merged.intlOptions, source.intlOptions);
  }

  return merged;
}

function buildResolvedOptions(
  locale: string | string[] | undefined,
  intlOptions: Intl.DateTimeFormatOptions,
  originalLocale?: string | string[],
): ResolvedDateFormatOptions {
  const normalizedLocale = ensureLocale(locale ?? originalLocale);
  const formatter = new Intl.DateTimeFormat(normalizedLocale, intlOptions);
  const resolved = formatter.resolvedOptions();

  const fallbackOriginal = originalLocale ?? normalizedLocale;

  return {
    ...resolved,
    originalLocale: fallbackOriginal,
  };
}

function formatValue(
  value: DateInput,
  locale: string | string[] | undefined,
  intlOptions: Intl.DateTimeFormatOptions,
  originalLocale?: string | string[],
): UseDateFormatResult {
  const normalizedDate = normalizeDateInput(value);
  const resolvedOptions = buildResolvedOptions(locale, intlOptions, originalLocale);

  if (!normalizedDate) {
    return {
      formattedValue: 'Invalid Date',
      parts: [],
      date: null,
      resolvedOptions,
      isInvalid: true,
    };
  }

  const normalizedLocale = ensureLocale(locale ?? originalLocale);
  const formatter = new Intl.DateTimeFormat(normalizedLocale, intlOptions);
  const parts = formatter.formatToParts(normalizedDate);

  return {
    formattedValue: formatter.format(normalizedDate),
    parts,
    date: normalizedDate,
    resolvedOptions,
    isInvalid: false,
  };
}

/**
 * @name resolveDateFormatOptions
 * @description 合并调用参数与上下文默认值，返回 `Intl.DateTimeFormat` 的完整解析结果。
 *
 * @since 0.0.1
 *
 * @param options - 本次调用的格式化配置
 * @param contextDefaults - 来自 `DateFormatProvider` 的上下文默认值
 * @returns `Intl.DateTimeFormat` 的解析选项，额外包含 `originalLocale`
 *
 * @example
 * ```ts
 * import { resolveDateFormatOptions } from '@internationalized/date-format';
 *
 * const resolved = resolveDateFormatOptions(
 *   { dateStyle: 'long', timeZone: 'Asia/Shanghai' },
 *   { locale: 'zh-CN' }
 * );
 *
 * console.log(resolved.locale); // zh-CN
 * console.log(resolved.timeZone); // Asia/Shanghai
 * console.log(resolved.originalLocale); // zh-CN
 * ```
 */
export function resolveDateFormatOptions(
  options: UseDateFormatOptions = {},
  contextDefaults?: DateFormatContextValue | null,
): ResolvedDateFormatOptions {
  const { locale, intlOptions, originalLocale } = mergeOptions(contextDefaults, options);
  return buildResolvedOptions(locale, intlOptions, originalLocale);
}

/**
 * @name createDateFormatter
 * @description 创建可复用的日期格式化器，适用于非 React 环境或自定义封装。
 *
 * @since 0.0.1
 *
 * @param options - 基础配置，可通过 `contextDefaults` 传入 Provider 默认值
 * @returns 一个包含 `format` 与 `resolveOptions` 方法的日期格式化器
 *
 * @example
 * ```ts
 * import { createDateFormatter } from '@internationalized/date-format';
 *
 * const formatter = createDateFormatter({
 *   dateStyle: 'medium',
 *   timeStyle: 'short',
 *   contextDefaults: { locale: 'zh-CN', timeZone: 'Asia/Shanghai' },
 * });
 *
 * const result = formatter.format(new Date('2024-05-20T00:00:00Z'));
 * console.log(result.formattedValue); // 2024/5/20 上午8:00
 * console.log(result.resolvedOptions.locale); // zh-CN
 * ```
 */
export function createDateFormatter(
  options: CreateDateFormatOptions = {},
): DateFormatter {
  const { contextDefaults = null, ...baseOptions } = options;

  return {
    format(value: DateInput, overrideOptions?: UseDateFormatOptions): UseDateFormatResult {
      const { locale, intlOptions, originalLocale } = mergeOptions(
        contextDefaults,
        baseOptions,
        overrideOptions,
      );
      return formatValue(value, locale, intlOptions, originalLocale);
    },
    resolveOptions(overrideOptions?: UseDateFormatOptions): ResolvedDateFormatOptions {
      const { locale, intlOptions, originalLocale } = mergeOptions(
        contextDefaults,
        baseOptions,
        overrideOptions,
      );
      return buildResolvedOptions(locale, intlOptions, originalLocale);
    },
  };
}
