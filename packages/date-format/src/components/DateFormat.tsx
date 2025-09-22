import { forwardRef, ElementType, memo } from 'react';
import type { ReactNode } from 'react';
import { useDateFormat } from '../hooks';
import type { UseDateFormatOptions, UseDateFormatResult, DateInput } from '../core/types';
import { BaseDateFormat } from './_internal/BaseDateFormat';

export type DateFormatProps<T extends ElementType = 'time'> = Omit<
  React.ComponentPropsWithoutRef<T>,
  'children'
> & {
  value: DateInput;
  options?: UseDateFormatOptions;
  fallback?: ReactNode;
  asChild?: boolean;
  as?: T;
  children?: ReactNode | ((result: UseDateFormatResult) => ReactNode);
};

const DateFormatImpl = forwardRef(
  <T extends ElementType = 'time'>(
    props: DateFormatProps<T>,
    ref: React.ComponentPropsWithRef<T>['ref'],
  ) => {
    const { options, ...rest } = props;
    const formatter = useDateFormat(options);

    return <BaseDateFormat {...rest} formatter={formatter} ref={ref} />;
  },
);

DateFormatImpl.displayName = 'DateFormat';

/**
 * @name DateFormat
 * @description 多态的日期时间格式化组件，基于 `Intl.DateTimeFormat` 并自动继承 `DateFormatProvider`
 *   - 核心属性：`value` 待格式化的日期/时间输入，支持 `Date`、时间戳与 ISO 字符串
 *   - 配置属性：`options` 传入 `useDateFormat` 的选项，可覆盖 locale 与所有 Intl 选项
 *   - 渲染属性：`as` 指定渲染元素、`asChild` 插槽模式、`fallback` 无法格式化时的回退内容
 *   - 子节点：可传入函数以获取 `UseDateFormatResult` 并实现自定义渲染
 *
 * @since 0.0.1
 *
 * @example
 * ```tsx
 * import { DateFormat } from '@internationalized/date-format';
 *
 * // 直接渲染 <time> 元素
 * <DateFormat value={new Date('2024-05-20T08:00:00Z')} options={{ timeZone: 'Asia/Shanghai' }} />
 * // => <time>2024/5/20 上午4:00:00</time>
 *
 * // 使用 asChild 将格式化结果注入子组件
 * <DateFormat value={Date.now()} asChild>
 *   <span className="text-muted">当前时间：</span>
 * </DateFormat>
 * // => <span class="text-muted">当前时间：2024/5/20 上午4:00:00</span>
 *
 * // 函数式 children，获取格式化结果详情
 * <DateFormat value={new Date()}>{({ formattedValue, resolvedOptions }) => (
 *   <output data-locale={resolvedOptions.locale}>{formattedValue}</output>
 * )}</DateFormat>
 * ```
 */
export const DateFormat = memo(DateFormatImpl) as <T extends ElementType = 'time'>(
  props: DateFormatProps<T> & { ref?: React.ComponentPropsWithRef<T>['ref'] },
) => JSX.Element;
