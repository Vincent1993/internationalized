import React from 'react';
import { useNumberFormatContext } from '../core/context';
import { resolveFormatOptions } from '../core/formatter';
import type { UseFormatOptions, MetricFormatRule, AutoNumberProps } from '../core/types';
import { mergeRules } from '../core/utils/rules';
import { useFormat } from './useFormat';

/**
 * 根据指标名称查找匹配的规则
 * 优先级：精确匹配 > 正则匹配
 */
function findRule(rules: MetricFormatRule[], name: string): MetricFormatRule | null {
  // 优先查找精确匹配
  const exactMatch = rules.find((rule) => rule.name === name);
  if (exactMatch) {
    return exactMatch;
  }

  // 查找正则模式匹配
  const patternMatch = rules.find((rule) => {
    if (!rule.pattern) return false;
    try {
      let regex: RegExp;

      // 如果 pattern 已经是 RegExp 对象，直接使用
      if (rule.pattern instanceof RegExp) {
        regex = rule.pattern;
      } else {
        // 如果是字符串，创建 RegExp 对象
        regex = new RegExp(rule.pattern);
      }

      return regex.test(name);
    } catch (e) {
      console.warn(`Invalid regex pattern: ${rule.pattern}`, e);
      return false;
    }
  });

  return patternMatch || null;
}

/**
 * 获取指标的格式化配置
 */
function getFormatConfig(
  name: string,
  rules: MetricFormatRule[],
  fallback: Partial<AutoNumberProps> = {},
): Omit<AutoNumberProps, 'value'> {
  const rule = findRule(rules, name);
  if (!rule) {
    return { style: 'decimal', ...fallback };
  }

  // 从新的结构中提取 options
  const { options } = rule;
  return { ...options, ...fallback };
}

/**
 * 自动格式化 hook 选项
 *
 * @description useAutoFormat hook 的配置选项，基于指标名称自动应用格式化规则
 */
export interface UseAutoFormatOptions extends Omit<UseFormatOptions, 'value'> {
  /** 指标名称，用于匹配规则 */
  name: string;
  /** 组件级规则配置 */
  rules?: MetricFormatRule[];
}

/**
 * 自动指标格式化 hook
 *
 * @description 基于指标名称自动应用格式化规则的 React hook
 *
 * @param options - 包含指标名称和规则的配置选项
 * @returns 包含 format 方法的格式化器对象
 *
 * @example
 * ```tsx
 * // 在 Provider 中配置全局规则
 * const globalRules = [
 *   { name: 'revenue', options: { style: 'currency', currency: 'CNY' } },
 *   { pattern: '.*_rate$', options: { style: 'percent', maximumFractionDigits: 2 } },
 *   { pattern: /.*_count$/i, options: { style: 'decimal', useGrouping: true } }
 * ];
 *
 * // 在组件中使用
 * function MetricDisplay() {
 *   // 精确匹配：revenue -> 货币格式
 *   const { format: formatRevenue } = useAutoFormat({ name: 'revenue' });
 *
 *   // 正则匹配：conversion_rate -> 百分比格式
 *   const { format: formatRate } = useAutoFormat({ name: 'conversion_rate' });
 *
 *   // 带局部规则覆盖
 *   const { format: formatCustom } = useAutoFormat({
 *     name: 'special_metric',
 *     rules: [
 *       { name: 'special_metric', options: { style: 'decimal', minimumFractionDigits: 3 } }
 *     ]
 *   });
 *
 *   return (
 *     <div>
 *       <div>Revenue: {formatRevenue(12345.67).formattedValue}</div>
 *       <div>Rate: {formatRate(0.1234).formattedValue}</div>
 *       <div>Custom: {formatCustom(42.1).formattedValue}</div>
 *     </div>
 *   );
 * }
 *
 * // 规则优先级：
 * // 1. 局部 rules 参数（最高优先级）
 * // 2. Provider 中的全局规则
 * // 3. 精确匹配优先于正则匹配
 *
 * // 检查解析的选项
 * const { format: debugFormat, resolveOptions: debugResolveOptions } = useAutoFormat({
 *   name: 'conversion_rate'
 * });
 * const debugResult = debugFormat(0.1234);
 * console.log(debugResult.resolvedOptions.style); // "percent" (基于规则匹配)
 * console.log(debugResult.resolvedOptions.maximumFractionDigits); // 2
 * console.log(debugResult.formattedValue); // "12.34%"
 *
 * // 直接获取解析的选项（不进行格式化）
 * const resolvedOptions = debugResolveOptions();
 * console.log(resolvedOptions.style); // "percent"
 * console.log(resolvedOptions.originalStyle); // "percent"
 * console.log(resolvedOptions.maximumFractionDigits); // 2
 * console.log(resolvedOptions.numberingSystem); // "latn" (来自 Intl)
 * console.log(resolvedOptions.locale); // "zh-CN"
 * console.log(resolvedOptions.minimumFractionDigits); // 0 (来自 Intl)
 * ```
 */
export const useAutoFormat = (props: UseAutoFormatOptions) => {
  const { name, rules = [], ...options } = props;
  const context = useNumberFormatContext();

  // 使用稳定的依赖，避免解构导致的对象引用变化
  const config = React.useMemo(() => {
    const allRules = mergeRules(context?.rules || [], rules);
    return getFormatConfig(name, allRules, options);
  }, [name, context?.rules, rules, options]); // 使用序列化比较 options 内容

  const { format } = useFormat(config);

  const resolveOptionsFunc = React.useMemo(() => {
    return () => resolveFormatOptions(config, context);
  }, [config, context]);

  return React.useMemo(
    () => ({
      format,
      resolveOptions: resolveOptionsFunc,
    }),
    [format, resolveOptionsFunc],
  );
};
