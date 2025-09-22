import { useMemo } from 'react';
import { createDateFormatter } from '../core/formatter';
import { useDateFormatContext } from '../core/context';
import type { DateFormatter, UseDateFormatOptions } from '../core/types';

/**
 * @name useDateFormat
 * @description React Hook，用于创建日期时间格式化器。Hook 会合并 `DateFormatProvider`
 * 提供的上下文选项，并基于 `Intl.DateTimeFormat` 返回可复用的格式化与选项解析函数。
 *
 * @since 0.0.1
 *
 * @param options - 覆盖默认行为的格式化选项，支持所有 `Intl.DateTimeFormatOptions`
 * @returns 一个包含 `format` 与 `resolveOptions` 的日期格式化器对象
 *
 * @example
 * ```tsx
 * import { useDateFormat } from '@internationalized/date-format';
 *
 * function Clock() {
 *   const formatter = useDateFormat({
 *     timeStyle: 'medium',
 *     dateStyle: 'short',
 *     timeZone: 'Asia/Shanghai',
 *   });
 *
 *   const now = new Date();
 *   const result = formatter.format(now);
 *
 *   return <time dateTime={result.date?.toISOString()}>{result.formattedValue}</time>;
 * }
 * ```
 */
export function useDateFormat(options: UseDateFormatOptions = {}): DateFormatter {
  const contextDefaults = useDateFormatContext();

  return useMemo(() => {
    return createDateFormatter({ ...options, contextDefaults });
  }, [options, contextDefaults]);
}
