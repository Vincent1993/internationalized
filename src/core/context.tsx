import { createContext, useContext, useMemo } from 'react';
import type { NumberFormatContextValue, NumberFormatProviderProps } from './types';
import { mergeRules } from './utils/rules';

const NumberFormatContext = createContext<NumberFormatContextValue | null>(null);

/**
 * 全局数字格式化 Provider
 *
 * @description 为应用提供全局的数字格式化配置上下文，支持所有 Intl.NumberFormat 选项和指标规则
 *
 * @example
 * ```tsx
 * import { NumberFormatProvider, NumberFormat, AutoMetricNumber } from '@your-package/number-format';
 *
 * // 推荐用法：使用 options 对象
 * function App() {
 *   return (
 *     <NumberFormatProvider
 *       options={{
 *         locale: "zh-CN",
 *         useGrouping: true,
 *         minimumFractionDigits: 2
 *       }}
 *     >
 *       <Dashboard />
 *     </NumberFormatProvider>
 *   );
 * }
 *
 * // 带指标规则的配置
 * function AppWithRules() {
 *   const options = {
 *     locale: "zh-CN",
 *     useGrouping: true,
 *     rules: [
 *       // 精确匹配规则
 *       { name: 'revenue', options: { style: 'currency', currency: 'CNY' } },
 *       { name: 'profit', options: { style: 'currency', currency: 'CNY' } },
 *       { name: 'cost', options: { style: 'currency', currency: 'CNY' } },
 *
 *       // 正则匹配规则
 *       { pattern: '.*_rate$', options: { style: 'percent', maximumFractionDigits: 2 } },
 *       { pattern: '.*_ratio$', options: { style: 'percent', maximumFractionDigits: 1 } },
 *       { pattern: '.*_count$', options: { style: 'decimal', useGrouping: true } },
 *       { pattern: '.*_permille$', options: { style: 'per-mille' } },
 *       { pattern: '.*_permyriad$', options: { style: 'per-myriad' } },
 *       { pattern: '.*_pp$', options: { style: 'percentage-point' } },
 *       { pattern: '.*_cn_upper$', options: { style: 'cn-upper' } },
 *     ]
 *   };
 *
 *   return (
 *     <NumberFormatProvider options={options}>
 *       <MetricDashboard />
 *     </NumberFormatProvider>
 *   );
 * }
 *
 * // 嵌套 Provider（局部覆盖全局配置）
 * function NestedProviders() {
 *   return (
 *     <NumberFormatProvider options={{ locale: "zh-CN", useGrouping: true }}>
 *       <div>
 *         <h1>Global Config</h1>
 *         <NumberFormat value={1234.56} />
 *
 *         <NumberFormatProvider options={{ locale: "en-US", style: "currency", currency: "USD" }}>
 *           <div>
 *             <h2>Local Override</h2>
 *             <NumberFormat value={1234.56} />
 *           </div>
 *         </NumberFormatProvider>
 *       </div>
 *     </NumberFormatProvider>
 *   );
 * }
 * ```
 */
export const NumberFormatProvider = ({ children, options }: NumberFormatProviderProps) => {
  const parentValue = useNumberFormatContext();

  const value = useMemo<NumberFormatContextValue | null>(() => {
    if (!options) {
      return parentValue;
    }

    if (!parentValue) {
      return options;
    }

    const mergedValue: NumberFormatContextValue = {
      ...parentValue,
      ...options,
      rules: mergeRules(parentValue.rules || [], options.rules || []),
    };

    if (mergedValue.rules?.length === 0) {
      delete mergedValue.rules;
    }

    return mergedValue;
  }, [parentValue, options]);

  return <NumberFormatContext.Provider value={value}>{children}</NumberFormatContext.Provider>;
};

/**
 * 获取数字格式化上下文
 * @internal
 * @description React Hook，用于获取当前的数字格式化上下文配置
 * 主要供内部 hooks 和组件使用，也可用于自定义组件
 *
 * @returns 当前上下文的配置值，如果没有 Provider 则返回空对象
 *
 */
export const useNumberFormatContext = (): NumberFormatContextValue | null => {
  return useContext(NumberFormatContext);
};
