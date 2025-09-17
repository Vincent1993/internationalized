/**
 * @name 内部基础格式化组件
 * @internal
 * @description 这是一个不对外导出的、纯粹负责渲染逻辑的共享组件。
 */

import {
  forwardRef,
  useMemo,
  ElementType,
  cloneElement,
  isValidElement,
  ReactNode,
  memo,
} from 'react';
import type { UseFormatResult, NumberFormatter } from '../../core/types';
import { Slot } from './Slot';

type BaseNumberFormatProps<T extends ElementType = 'span'> = Omit<
  React.ComponentPropsWithoutRef<T>,
  'children'
> & {
  value: unknown;
  formatter: NumberFormatter;
  fallback?: ReactNode;
  asChild?: boolean;
  as?: T;
  children?: ReactNode | ((result: UseFormatResult) => ReactNode);
};

const BaseNumberFormat = forwardRef(
  <T extends ElementType = 'span'>(
    {
      children,
      asChild = false,
      fallback,
      value,
      formatter,
      as,
      ...domProps
    }: BaseNumberFormatProps<T>,
    ref: React.ComponentPropsWithRef<T>['ref'],
  ) => {
    if (process.env.NODE_ENV !== 'production' && as && asChild) {
      console.warn('警告: `as` 和 `asChild` 属性不应同时使用。`asChild` 将会覆盖 `as` 的设置。');
    }

    const Component = asChild ? Slot : as || 'span';
    const result = useMemo(() => formatter.format(value), [formatter, value]);

    if (typeof children === 'function') {
      return (
        <Component ref={ref} {...domProps}>
          {children(result)}
        </Component>
      );
    }

    if (asChild) {
      if (process.env.NODE_ENV !== 'production' && typeof children === 'undefined') {
        console.warn(
          '警告: 使用了 `asChild` 属性，但未提供任何子元素。`asChild` 模式需要一个子元素来注入内容。',
        );
      }
      const content = result.formattedValue;
      return (
        <Component ref={ref} {...domProps}>
          {isValidElement(children) ? cloneElement(children, undefined, content) : content}
        </Component>
      );
    }

    const content = children ?? result.formattedValue;

    return (
      <Component ref={ref} {...domProps}>
        {content}
      </Component>
    );
  },
);

BaseNumberFormat.displayName = 'BaseNumberFormat';

export const BaseNumberFormatMemo = memo(BaseNumberFormat) as <T extends ElementType = 'span'>(
  props: BaseNumberFormatProps<T> & { ref?: React.ComponentPropsWithRef<T>['ref'] },
) => JSX.Element;

// 为了向后兼容，保留原有的导出
export { BaseNumberFormatMemo as BaseNumberFormat };
