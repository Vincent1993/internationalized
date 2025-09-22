import { forwardRef, ElementType, memo } from 'react';
import type { ReactNode } from 'react';
import { useAutoFormat } from '../hooks/useAutoFormat';
import type { MetricFormatRule, UseFormatResult } from '../core/types';
import { BaseNumberFormat } from './_internal/BaseNumberFormat';

export type AutoMetricNumberProps<T extends ElementType = 'span'> = Omit<
  React.ComponentPropsWithoutRef<T>,
  'children'
> & {
  value: unknown;
  name: string;
  rules?: MetricFormatRule[];
  fallback?: ReactNode;
  asChild?: boolean;
  as?: T;
  children?: ReactNode | ((result: UseFormatResult) => ReactNode);
};

/**
 * @name AutoMetricNumber
 * @description 一个智能的指标格式化组件，可根据指标名称自动应用预设的格式化规则。
 *   - 核心属性：`value` 数值、`name` 指标名称、`rules` 规则配置
 *   - 渲染属性：`as` 多态元素、`asChild` 插槽模式、`fallback` 错误回退
 *   - 交互属性：`children` 函数式渲染（接收 `UseFormatResult`）
 *   - 支持所有 React 元素属性（继承自 `React.ComponentPropsWithoutRef<T>`）
 *   - 规则可以由 `NumberFormatProvider` 全局提供，也可以由组件局部提供
 *   - 优先级：局部 `rules` > 全局 `rules` > 默认配置
 *
 * @param value - 要格式化的数值
 * @param name - 指标名称，用于匹配格式化规则
 * @param rules - 局部格式化规则数组
 * @param fallback - 错误时的回退内容
 * @param asChild - 是否作为子组件渲染（插槽模式）
 * @param as - 渲染的 HTML 元素类型，默认为 'span'
 * @param children - 函数式子组件，接收 `UseFormatResult` 参数
 * @param ...props - 所有其他 React 元素属性
 *
 * @since 0.0.1
 *
 * @example
 * ```tsx
 * // 1. 在 Provider 中定义全局规则
 * const globalRules = [
 *   { name: 'revenue', options: { style: 'currency', currency: 'USD' } },
 *   { pattern: /rate$/, options: { style: 'percent', maximumFractionDigits: 2 } },
 * ];
 *
 * <NumberFormatProvider options={{ rules: globalRules }}>
 *   <Dashboard />
 * </NumberFormatProvider>
 *
 * // 2. 在 Dashboard 组件中使用
 * function Dashboard() {
 *   return (
 *     <div>
 *       // 匹配到名为 'revenue' 的精确规则
 *       <AutoMetricNumber name="revenue" value={12345.67} />
 *       // => <span>$12,345.67</span>
 *
 *       // 匹配到 `/_rate$/` 的正则规则
 *       <AutoMetricNumber name="conversion_rate" value={0.12345} />
 *       // => <span>12.35%</span>
 *
 *       // 使用局部 `rules` 覆盖全局规则
 *       <AutoMetricNumber
 *         name="revenue"
 *         value={12345.67}
 *         rules={[{ name: 'revenue', options: { currency: 'EUR' } }]}
 *       />
 *       // => <span>€12,345.67</span>
 *
 *       // 使用函数式 children 自定义渲染
 *       <AutoMetricNumber name="growth_rate" value={-0.05}>
 *         {(result) => (
 *           <strong className={result.sign.isNegative ? 'text-red-500' : 'text-green-500'}>
 *             {result.formattedValue}
 *           </strong>
 *         )}
 *       </AutoMetricNumber>
 *       // => <strong class="text-red-500">-5%</strong>
 *     </div>
 *   );
 * }
 * ```
 */
const AutoMetricNumberImpl = forwardRef(
  <T extends ElementType = 'span'>(
    props: AutoMetricNumberProps<T>,
    ref: React.ComponentPropsWithRef<T>['ref'],
  ) => {
    const { name, rules, ...rest } = props;
    const formatter = useAutoFormat({ name, rules });

    return <BaseNumberFormat {...rest} formatter={formatter} ref={ref} />;
  },
);

AutoMetricNumberImpl.displayName = 'AutoMetricNumber';

export const AutoMetricNumber = memo(AutoMetricNumberImpl) as <T extends ElementType = 'span'>(
  props: AutoMetricNumberProps<T> & { ref?: React.ComponentPropsWithRef<T>['ref'] },
) => JSX.Element;
