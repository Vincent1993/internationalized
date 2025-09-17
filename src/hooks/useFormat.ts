import { useMemo } from 'react';
import { createFormatterCore } from '../core/formatter';
import { useNumberFormatContext } from '../core/context';
import type { UseFormatOptions, NumberFormatter } from '../core/types';

/**
 * 基础数字格式化 hook
 *
 * @description 提供数字格式化功能的 React hook，返回格式化器对象
 *
 * @param options - 格式化配置选项
 * @returns 包含 format 方法的格式化器对象
 *
 * @example
 * ```tsx
 * // 基础用法
 * const { format } = useFormat({ style: 'decimal', maximumFractionDigits: 2 });
 * const result = format(3.14159);
 * console.log(result.formattedValue); // "3.14"
 * console.log(result.resolvedOptions.maximumFractionDigits); // 2
 * console.log(result.resolvedOptions.locale); // "zh-CN"
 *
 * // 货币格式
 * const { format: formatCurrency } = useFormat({
 *   style: 'currency',
 *   currency: 'CNY',
 *   minimumFractionDigits: 2
 * });
 * const currencyResult = formatCurrency(1234.5);
 * console.log(currencyResult.formattedValue); // "¥1,234.50"
 * console.log(currencyResult.resolvedOptions.currency); // "CNY"
 * console.log(currencyResult.resolvedOptions.style); // "currency"
 *
 * // 百分比格式
 * const { format: formatPercent } = useFormat({
 *   style: 'percent',
 *   maximumFractionDigits: 1
 * });
 * const percentResult = formatPercent(0.1234);
 * console.log(percentResult.formattedValue); // "12.3%"
 * console.log(percentResult.resolvedOptions.style); // "percent"
 *
 * // 使用插件扩展样式
 * const { format: formatPermille } = useFormat({ style: 'per-mille' });
 * const permilleResult = formatPermille(0.123);
 * console.log(permilleResult.formattedValue); // "123‰"
 * console.log(permilleResult.resolvedOptions.style); // "decimal" (插件内部转换)
 *
 * // 检查解析的选项
 * const { format: formatWithSign, resolveOptions } = useFormat({
 *   style: 'decimal',
 *   includeSign: true,
 *   useGrouping: false
 * });
 * const resultWithSign = formatWithSign(42);
 * console.log(resultWithSign.formattedValue); // "+42"
 * console.log(resultWithSign.resolvedOptions.includeSign); // true
 * console.log(resultWithSign.resolvedOptions.useGrouping); // false
 *
 * // 直接获取解析的选项（不进行格式化）
 * const resolvedOptions = resolveOptions();
 * console.log(resolvedOptions.style); // "decimal"
 * console.log(resolvedOptions.includeSign); // true
 * console.log(resolvedOptions.locale); // "zh-CN"
 * console.log(resolvedOptions.numberingSystem); // "latn" (来自 Intl)
 * console.log(resolvedOptions.useGrouping); // "auto" (来自 Intl)
 * console.log(resolvedOptions.roundingMode); // "halfExpand" (来自 Intl)
 * ```
 */
export const useFormat = (options: UseFormatOptions = {}): NumberFormatter => {
  const contextDefaults = useNumberFormatContext();

  return useMemo(() => {
    return createFormatterCore(options, contextDefaults);
  }, [options, contextDefaults]);
};
