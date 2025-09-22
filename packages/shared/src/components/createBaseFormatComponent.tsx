import { cloneElement, forwardRef, isValidElement, memo, useMemo } from 'react';
import type {
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  ElementType,
  ReactNode,
} from 'react';
import { Slot } from './Slot';

/**
 * @zh 统一的格式化渲染器接口定义
 */
export interface FormatInvoker<TValue, TResult> {
  /**
   * @zh 执行实际的格式化操作
   */
  format(value: TValue): TResult;
}

interface BaseFormatResultLike {
  formattedValue: string;
}

interface EnhancePropsParams<TResult> {
  result: TResult;
  invalid: boolean;
  asChild: boolean;
  component: ElementType;
  props: Record<string, unknown>;
}

interface ResolveContentParams<TResult> {
  result: TResult;
  fallback?: ReactNode;
}

interface ResolveAsChildContentParams<TResult> {
  result: TResult;
}

interface CreateBaseFormatComponentOptions<TResult extends BaseFormatResultLike> {
  /** @zh 默认渲染元素 */
  defaultElement: ElementType;
  /** @zh 组件名称，便于调试 */
  displayName: string;
  /** @zh `as` 与 `asChild` 同时存在时的警告文案 */
  conflictWarning?: string;
  /** @zh `asChild` 模式缺少子元素时的警告文案 */
  missingChildWarning?: string;
  /** @zh 判断结果是否无效 */
  isInvalid?: (result: TResult) => boolean;
  /** @zh 自定义默认内容 */
  resolveDefaultContent?: (params: ResolveAsChildContentParams<TResult>) => ReactNode;
  /** @zh 自定义无效状态内容 */
  resolveInvalidContent?: (params: ResolveContentParams<TResult>) => ReactNode;
  /** @zh 自定义 `asChild` 下的无效内容 */
  resolveInvalidAsChild?: (params: ResolveContentParams<TResult>) => ReactNode | null;
  /** @zh 自定义 `asChild` 模式注入的内容 */
  resolveAsChildContent?: (params: ResolveAsChildContentParams<TResult>) => ReactNode;
  /** @zh 根据格式化结果追加 DOM 属性 */
  enhanceComponentProps?: (params: EnhancePropsParams<TResult>) =>
    | Record<string, unknown>
    | void;
}

export interface BaseFormatComponentProps<
  TValue,
  TResult extends BaseFormatResultLike,
  Formatter extends FormatInvoker<TValue, TResult>,
  TElement extends ElementType,
> extends Omit<ComponentPropsWithoutRef<TElement>, 'children'> {
  /** @zh 待格式化的原始值 */
  value: TValue;
  /** @zh 实际执行格式化的实例 */
  formatter: Formatter;
  /** @zh 当结果无效时的回退内容 */
  fallback?: ReactNode;
  /** @zh 是否启用 `asChild` 模式 */
  asChild?: boolean;
  /** @zh 自定义渲染元素 */
  as?: TElement;
  /** @zh 子节点或函数式子节点 */
  children?: ReactNode | ((result: TResult) => ReactNode);
}

/**
 * @zh 创建一个高度可定制的基础格式化组件
 */
export function createBaseFormatComponent<
  TValue,
  TResult extends BaseFormatResultLike,
  Formatter extends FormatInvoker<TValue, TResult>,
  TDefaultElement extends ElementType,
>(options: CreateBaseFormatComponentOptions<TResult>) {
  const {
    defaultElement,
    displayName,
    conflictWarning =
      '警告：`as` 和 `asChild` 属性不应同时使用，`asChild` 会覆盖 `as` 设置。',
    missingChildWarning =
      '警告：使用了 `asChild` 属性，但未提供任何子元素。请提供一个可渲染的子节点。',
    isInvalid,
    resolveDefaultContent,
    resolveInvalidContent,
    resolveInvalidAsChild,
    resolveAsChildContent,
    enhanceComponentProps,
  } = options;

  const BaseFormatImpl = forwardRef(
    <TElement extends ElementType = TDefaultElement>(
      props: BaseFormatComponentProps<TValue, TResult, Formatter, TElement>,
      ref: ComponentPropsWithRef<TElement>['ref'],
    ) => {
      const {
        children,
        asChild = false,
        fallback,
        value,
        formatter,
        as,
        ...domProps
      } = props;

      if (process.env.NODE_ENV !== 'production' && as && asChild) {
        console.warn(conflictWarning);
      }

      const Component = (asChild ? Slot : as || defaultElement) as ElementType;
      const result = useMemo(() => formatter.format(value), [formatter, value]);
      const invalid = isInvalid?.(result) ?? false;
      const componentProps: Record<string, unknown> = { ...domProps };

      if (enhanceComponentProps) {
        const enhanced = enhanceComponentProps({
          result,
          invalid,
          asChild,
          component: Component,
          props: componentProps,
        });

        if (enhanced) {
          Object.assign(componentProps, enhanced);
        }
      }

      const defaultContent =
        resolveDefaultContent?.({ result }) ?? result.formattedValue;

      if (invalid) {
        if (asChild) {
          const invalidAsChildContent =
            resolveInvalidAsChild?.({ result, fallback }) ?? fallback ?? null;
          return invalidAsChildContent ?? null;
        }

        const invalidContent =
          resolveInvalidContent?.({ result, fallback }) ??
          fallback ??
          defaultContent;

        return (
          <Component
            ref={ref}
            {...(componentProps as ComponentPropsWithoutRef<TElement>)}
          >
            {invalidContent}
          </Component>
        );
      }

      if (typeof children === 'function') {
        return (
          <Component
            ref={ref}
            {...(componentProps as ComponentPropsWithoutRef<TElement>)}
          >
            {children(result)}
          </Component>
        );
      }

      if (asChild) {
        if (process.env.NODE_ENV !== 'production' && typeof children === 'undefined') {
          console.warn(missingChildWarning);
        }

        const injectedContent =
          resolveAsChildContent?.({ result }) ?? defaultContent;

        return (
          <Component
            ref={ref}
            {...(componentProps as ComponentPropsWithoutRef<TElement>)}
          >
            {isValidElement(children)
              ? cloneElement(children, undefined, injectedContent)
              : injectedContent}
          </Component>
        );
      }

      const content =
        typeof children !== 'undefined' ? children : defaultContent;

      return (
        <Component
          ref={ref}
          {...(componentProps as ComponentPropsWithoutRef<TElement>)}
        >
          {content}
        </Component>
      );
    },
  );

  BaseFormatImpl.displayName = displayName;

  return memo(BaseFormatImpl) as <TElement extends ElementType = TDefaultElement>(
    props: BaseFormatComponentProps<TValue, TResult, Formatter, TElement> & {
      ref?: ComponentPropsWithRef<TElement>['ref'];
    },
  ) => JSX.Element;
}
