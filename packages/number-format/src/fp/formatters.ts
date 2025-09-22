import type { UseFormatOptions, UseFormatResult } from '../core/types';
import { getMemoizedFormatter } from './memoize';
import { mergeOptionsWithDefaults, type FormatterDefaults } from './defaults';

/**
 * 通用格式化函数，使用默认配置并强制覆盖指定的选项
 * @param type 格式化类型
 * @param value 要格式化的值
 * @param userOptions 用户提供的选项
 * @param forcedOptions 强制覆盖的选项
 * @returns 格式化后的字符串
 */
function formatWithDefaults<T extends keyof FormatterDefaults>(
  type: T,
  value: unknown,
  userOptions: UseFormatOptions | undefined,
  forcedOptions: UseFormatOptions,
): string {
  const finalOptions = mergeOptionsWithDefaults(type, userOptions, forcedOptions);
  const formatter = getMemoizedFormatter(finalOptions);
  return formatter.format(value).formattedValue;
}

/**
 * 与 formatWithDefaults 对应，返回完整 UseFormatResult
 */
function formatResultWithDefaults<T extends keyof FormatterDefaults>(
  type: T,
  value: unknown,
  userOptions: UseFormatOptions | undefined,
  forcedOptions: UseFormatOptions,
): UseFormatResult {
  const finalOptions = mergeOptionsWithDefaults(type, userOptions, forcedOptions);
  const formatter = getMemoizedFormatter(finalOptions);
  return formatter.format(value);
}

/**
 * 将数字格式化为十进制字符串。
 * @param value 要格式化的数字。
 * @param options 用于覆盖默认值的 Intl.NumberFormatOptions。
 * @returns 格式化后的数字字符串。
 */
export function formatAsDecimal(value: unknown, options?: UseFormatOptions): string {
  return formatWithDefaults('decimal', value, options, { style: 'decimal' });
}

export function formatAsDecimalEx(value: unknown, options?: UseFormatOptions): UseFormatResult {
  return formatResultWithDefaults('decimal', value, options, { style: 'decimal' });
}

/**
 * 将数字格式化为整数字符串（无小数部分）。
 * @param value 要格式化的数字，将被四舍五入为整数。
 * @param options 用于覆盖默认值的 Intl.NumberFormatOptions。
 * @returns 格式化后的整数字符串。
 */
export function formatAsInteger(value: unknown, options?: UseFormatOptions): string {
  // 强制覆盖 maximumFractionDigits 为 0，忽略用户传入的值
  const finalOptions = { ...options };
  delete finalOptions.maximumFractionDigits;

  return formatWithDefaults('integer', value, finalOptions, {
    style: 'decimal',
    extend_fixDecimals: 0,
  });
}

export function formatAsIntegerEx(value: unknown, options?: UseFormatOptions): UseFormatResult {
  // 强制覆盖 maximumFractionDigits 为 0，忽略用户传入的值
  const finalOptions = { ...options };
  delete finalOptions.maximumFractionDigits;

  return formatResultWithDefaults('integer', value, finalOptions, {
    style: 'decimal',
    extend_fixDecimals: 0,
  });
}

/**
 * 将数字格式化为货币字符串。
 * @param value 要格式化的数字。
 * @param currency ISO 4217 货币代码。
 * @param options 用于覆盖默认值的 Intl.NumberFormatOptions。
 * @returns 格式化后的货币字符串。
 */
export function formatAsCurrency(
  value: unknown,
  currency: string,
  options?: Omit<UseFormatOptions, 'style' | 'currency'>,
): string {
  return formatWithDefaults('currency', value, options, {
    style: 'currency',
    currency,
  });
}

export function formatAsCurrencyEx(
  value: unknown,
  currency: string,
  options?: Omit<UseFormatOptions, 'style' | 'currency'>,
): UseFormatResult {
  return formatResultWithDefaults('currency', value, options, {
    style: 'currency',
    currency,
  });
}

/**
 * 将数字格式化为百分比字符串。
 * @param value 要格式化的数字 (例如，0.75 表示 75%)。
 * @param options 用于覆盖默认值的 Intl.NumberFormatOptions。
 * @returns 格式化后的百分比字符串。
 */
export function formatAsPercent(value: unknown, options?: Omit<UseFormatOptions, 'style'>): string {
  return formatWithDefaults('percent', value, options, { style: 'percent' });
}

export function formatAsPercentEx(
  value: unknown,
  options?: Omit<UseFormatOptions, 'style'>,
): UseFormatResult {
  return formatResultWithDefaults('percent', value, options, { style: 'percent' });
}

/**
 * 将数字格式化为千分比 (‰) 字符串。
 * @param value 要格式化的数字 (例如，0.075 表示 75‰)。
 * @param options 用于覆盖默认值的 Intl.NumberFormatOptions。
 * @returns 格式化后的千分比字符串。
 */
export function formatAsPerMille(
  value: unknown,
  options?: Omit<UseFormatOptions, 'style'>,
): string {
  return formatWithDefaults('perMille', value, options, { style: 'per-mille' });
}

export function formatAsPerMilleEx(
  value: unknown,
  options?: Omit<UseFormatOptions, 'style'>,
): UseFormatResult {
  return formatResultWithDefaults('perMille', value, options, { style: 'per-mille' });
}

export function formatAsPerMyriad(
  value: unknown,
  options?: Omit<UseFormatOptions, 'style'>,
): string {
  return formatWithDefaults('perMyriad', value, options, { style: 'per-myriad' });
}

export function formatAsPerMyriadEx(
  value: unknown,
  options?: Omit<UseFormatOptions, 'style'>,
): UseFormatResult {
  return formatResultWithDefaults('perMyriad', value, options, { style: 'per-myriad' });
}

export function formatAsPercentagePoint(
  value: unknown,
  options?: Omit<UseFormatOptions, 'style'>,
): string {
  return formatWithDefaults('percentagePoint', value, options, { style: 'percentage-point' });
}

export function formatAsPercentagePointEx(
  value: unknown,
  options?: Omit<UseFormatOptions, 'style'>,
): UseFormatResult {
  return formatResultWithDefaults('percentagePoint', value, options, {
    style: 'percentage-point',
  });
}

export function formatAsChineseUppercase(
  value: unknown,
  options?: Omit<UseFormatOptions, 'style'>,
): string {
  return formatWithDefaults('cnUpper', value, options, { style: 'cn-upper' });
}

export function formatAsChineseUppercaseEx(
  value: unknown,
  options?: Omit<UseFormatOptions, 'style'>,
): UseFormatResult {
  return formatResultWithDefaults('cnUpper', value, options, { style: 'cn-upper' });
}

/**
 * 使用紧凑表示法格式化数字 (例如, 1.2M)。
 * @param value 要格式化的数字。
 * @param options 用于覆盖默认值的 Intl.NumberFormatOptions。
 * @returns 格式化后的紧凑数字字符串。
 */
export function formatAsCompact(
  value: unknown,
  options?: Omit<UseFormatOptions, 'style' | 'notation'>,
): string {
  return formatWithDefaults('compact', value, options, {
    style: 'decimal',
    notation: 'compact',
  });
}

export function formatAsCompactEx(
  value: unknown,
  options?: Omit<UseFormatOptions, 'style' | 'notation'>,
): UseFormatResult {
  return formatResultWithDefaults('compact', value, options, {
    style: 'decimal',
    notation: 'compact',
  });
}

/**
 * 使用科学记数法格式化数字。
 * @param value 要格式化的数字。
 * @param options 用于覆盖默认值的 Intl.NumberFormatOptions。
 * @returns 格式化后的科学记数法字符串。
 */
export function formatAsScientific(
  value: unknown,
  options?: Omit<UseFormatOptions, 'style' | 'notation'>,
): string {
  return formatWithDefaults('scientific', value, options, {
    style: 'decimal',
    notation: 'scientific',
  });
}

export function formatAsScientificEx(
  value: unknown,
  options?: Omit<UseFormatOptions, 'style' | 'notation'>,
): UseFormatResult {
  return formatResultWithDefaults('scientific', value, options, {
    style: 'decimal',
    notation: 'scientific',
  });
}
