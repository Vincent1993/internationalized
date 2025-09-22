import { forwardRef, ElementType, memo } from 'react';
import type { ReactNode } from 'react';
import { useFormat } from '../hooks/useFormat';
import type { UseFormatOptions, UseFormatResult } from '../core/types';
import { BaseNumberFormat } from './_internal/BaseNumberFormat';

export type NumberFormatProps<T extends ElementType = 'span'> = Omit<
  React.ComponentPropsWithoutRef<T>,
  'children'
> & {
  value: unknown;
  options?: UseFormatOptions;
  fallback?: ReactNode;
  asChild?: boolean;
  as?: T;
  children?: ReactNode | ((result: UseFormatResult) => ReactNode);
};

/**
 * @name NumberFormat
 * @description 一个功能强大的、支持多态的数字格式化组件。
 *   - 核心属性：`value` 数值、`options` 格式化配置（继承自 `useFormat` hook）
 *   - 渲染属性：`as` 多态元素、`asChild` 插槽模式、`fallback` 错误回退
 *   - 交互属性：`children` 函数式渲染（接收 `UseFormatResult`）
 *   - 支持所有 React 元素属性（继承自 `React.ComponentPropsWithoutRef<T>`）
 *   - 自动处理 `null`, `undefined`, `NaN` 等无效值
 *
 * @param value - 要格式化的数值
 * @param options - 格式化配置选项，继承自 `useFormat` hook 的 `UseFormatOptions`
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
 * // 基础用法
 * <NumberFormat value={1234.56} options={{ style: "decimal" }} />
 * // => <span>1,234.56</span>
 *
 * // 货币格式
 * <NumberFormat value={1234.56} options={{ style: "currency", currency: "CNY" }} />
 * // => <span>¥1,234.56</span>
 *
 * // 使用 `as` 属性渲染为 <div>
 * <NumberFormat value={99} as="div" className="font-bold" />
 * // => <div class="font-bold">99</div>
 *
 * // 函数式 children，用于自定义渲染
 * <NumberFormat value={-0.05} options={{ style: "percent" }}>
 *   {(result) => (
 *     <span className={result.sign.isNegative ? 'text-red-500' : 'text-green-500'}>
 *       {result.formattedValue}
 *     </span>
 *   )}
 * </NumberFormat>
 * // => <span class="text-red-500">-5%</span>
 *
 * // `asChild` 模式，将内容注入到子按钮
 * <NumberFormat value={42} asChild>
 *   <button>Count: </button>
 * </NumberFormat>
 * // => <button>Count: 42</button>
 * ```
 */
const NumberFormatImpl = forwardRef(
  <T extends ElementType = 'span'>(
    props: NumberFormatProps<T>,
    ref: React.ComponentPropsWithRef<T>['ref'],
  ) => {
    const { options, ...rest } = props;
    const formatter = useFormat(options);

    return <BaseNumberFormat {...rest} formatter={formatter} ref={ref} />;
  },
);

NumberFormatImpl.displayName = 'NumberFormat';

export const NumberFormat = memo(NumberFormatImpl) as <T extends ElementType = 'span'>(
  props: NumberFormatProps<T> & { ref?: React.ComponentPropsWithRef<T>['ref'] },
) => JSX.Element;
