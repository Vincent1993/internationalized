import type { ReactNode } from 'react';
import type { ExtendedStyle } from '../plugins';
import type { CoreExtensionOptions } from '../plugins/types';

/**
 * @name ValidatedFormatOptions (高级类型)
 * @description
 *   一个条件类型，用于在 TypeScript 编译时强制执行选项之间的互斥规则。
 *   - 规则1: 当 `notation` 为 `'compact' | 'scientific' | 'engineering'` 时，禁止使用 `minimumFractionDigits` 和 `maximumFractionDigits`。
 *   - 规则2: 当设置了 `minimumSignificantDigits` 或 `maximumSignificantDigits` 时，禁止使用 `minimumFractionDigits` 和 `maximumFractionDigits`。
 */
export type ValidatedFormatOptions<T extends Intl.NumberFormatOptions> =
  // 检查是否存在 significant-digits 相关的键
  keyof T extends 'minimumSignificantDigits' | 'maximumSignificantDigits'
    ? Omit<T, 'minimumFractionDigits' | 'maximumFractionDigits'> & {
        minimumFractionDigits?: never;
        maximumFractionDigits?: never;
      }
    : // 检查 notation 是否为冲突类型
    'notation' extends keyof T
    ? T['notation'] extends 'compact' | 'scientific' | 'engineering'
      ? Omit<T, 'minimumFractionDigits' | 'maximumFractionDigits'> & {
          minimumFractionDigits?: never;
          maximumFractionDigits?: never;
        }
      : T
    : T;

/**
 * @name 指标格式化规则
 *
 * @description 用于自动指标格式化的规则配置，支持精确匹配和正则匹配
 *
 * @example
 * ```tsx
 * const rules: MetricFormatRule[] = [
 *   // 精确匹配
 *   { name: 'revenue', options: { style: 'currency', currency: 'CNY' } },
 *
 *   // 字符串正则匹配
 *   { pattern: '.*_rate$', options: { style: 'percent', maximumFractionDigits: 2 } },
 *
 *   // RegExp 对象匹配
 *   { pattern: /price|cost/i, options: { style: 'currency', currency: 'USD' } },
 *
 *   // 千分号格式
 *   { pattern: /.*_permille$/i, options: { style: 'per-mille' } }
 * ];
 * ```
 */
/**
 * 基础的格式化规则配置
 */
interface BaseMetricFormatRule {
  /** 格式化配置选项 */
  options: Omit<Intl.NumberFormatOptions, 'style'> & {
    /** 格式化样式，支持原生 Intl 样式和插件扩展样式 */
    style?: ExtendedStyle;
  };
}

/**
 * 基于精确名称匹配的格式化规则
 */
interface NamedMetricFormatRule extends BaseMetricFormatRule {
  /** 指标名称，用于精确匹配 */
  name: string;
}

/**
 * 基于正则模式匹配的格式化规则
 */
interface PatternMetricFormatRule extends BaseMetricFormatRule {
  /** 正则模式，支持字符串或 RegExp 对象，用于模式匹配 */
  pattern: string | RegExp;
}

/**
 * 指标格式化规则
 *
 * @description name 和 pattern 互斥，只能选择其中一种匹配方式
 *
 * @example
 * ```typescript
 * // ✅ 正确：使用 name 进行精确匹配
 * const nameRule: MetricFormatRule = {
 *   name: 'revenue',
 *   options: { style: 'currency', currency: 'USD' }
 * };
 *
 * // ✅ 正确：使用 pattern 进行模式匹配
 * const patternRule: MetricFormatRule = {
 *   pattern: '.*_rate$',
 *   options: { style: 'percent' }
 * };
 *
 * // ❌ 错误：不能同时使用 name 和 pattern
 * const invalidRule: MetricFormatRule = {
 *   name: 'revenue',
 *   pattern: '.*revenue.*', // TypeScript 错误
 *   options: { style: 'currency' }
 * };
 * ```
 */
export type MetricFormatRule =
  | (NamedMetricFormatRule & { pattern?: never })
  | (PatternMetricFormatRule & { name?: never });

/**
 * 数字格式化上下文配置
 *
 * @description 用于 NumberFormatProvider 的全局配置选项
 *
 * @example
 * ```tsx
 * <NumberFormatProvider
 *   options={{
 *     locale: "zh-CN",
 *     style: "decimal",
 *     useGrouping: true,
 *     rules: [
 *       { name: 'price', options: { style: 'currency', currency: 'CNY' } },
 *       { pattern: '.*_percent$', options: { style: 'percent' } }
 *     ]
 *   }}
 * >
 *   <App />
 * </NumberFormatProvider>
 * ```
 */
export interface NumberFormatContextValue
  extends Omit<Intl.NumberFormatOptions, 'style'>,
    CoreExtensionOptions {
  /** 语言环境，支持字符串或字符串数组 */
  locale?: string | string[];
  /** 是否显示符号（+/-） */
  includeSign?: boolean;
  /** 格式化样式，支持原生 Intl 样式和插件扩展样式 */
  style?: ExtendedStyle;
  /** 指标格式化规则（可选） */
  rules?: MetricFormatRule[];
}

/**
 * NumberFormatProvider 组件的 Props
 *
 * @description NumberFormatProvider 组件的属性配置，使用 options 参数传递配置
 *
 * @example
 * ```tsx
 * <NumberFormatProvider
 *   options={{
 *     locale: "zh-CN",
 *     style: "currency",
 *     currency: "CNY",
 *     useGrouping: true,
 *     rules: [
 *       { name: 'revenue', options: { style: 'currency', currency: 'CNY' } },
 *       { pattern: '.*_rate$', options: { style: 'percent' } }
 *     ]
 *   }}
 * >
 *   <App />
 * </NumberFormatProvider>
 * ```
 */
export interface NumberFormatProviderProps {
  /** 子组件 */
  children: ReactNode;
  /** 格式化配置选项 */
  options?: NumberFormatContextValue;
}

/**
 * useFormat hook 的配置选项
 *
 * @description 基础数字格式化 hook 的配置参数
 *
 * @example
 * ```tsx
 * const options: UseFormatOptions = {
 *   style: 'currency',
 *   currency: 'CNY',
 *   minimumFractionDigits: 2,
 *   maximumFractionDigits: 2,
 *   includeSign: true
 * };
 * ```
 */
/**
 * useFormat hook 的配置选项
 *
 * @description 基础数字格式化 hook 的配置参数
 *
 * @example
 * ```tsx
 * const options: UseFormatOptions = {
 *   style: 'currency',
 *   currency: 'CNY',
 *   minimumFractionDigits: 2,
 *   maximumFractionDigits: 2,
 *   includeSign: true
 * };
 * ```
 */
export type UseFormatOptions = ValidatedFormatOptions<
  Omit<Intl.NumberFormatOptions, 'style'> & {
    /** 语言环境，支持字符串或字符串数组 */
    locale?: string | string[];
    /** 是否显示符号（+/-） */
    includeSign?: boolean;
    /** 格式化样式，支持原生 Intl 样式和插件扩展样式 */
    style?: ExtendedStyle;
  } & CoreExtensionOptions
>;

/**
 * useFormat hook 的返回结果
 *
 * @description 包含格式化后的值和相关元数据
 *
 * @example
 * ```tsx
 * const { format } = useFormat({ style: 'currency', currency: 'CNY' });
 * const result = format(1234.56);
 * // result.formattedValue: "¥1,234.56"
 * // result.sign.isPositive: true
 * // result.isNaN: false
 * // result.resolvedOptions: { style: 'currency', currency: 'CNY', locale: 'zh-CN', ... }
 * ```
 */
export interface UseFormatResult {
  /** 原始数值 */
  value: number;
  /** 格式化后的字符串 */
  formattedValue: string;
  /** Intl.NumberFormat 的格式化部分 */
  parts: Intl.NumberFormatPart[];
  /** 数值符号信息 */
  sign: {
    /** 是否为正数 */
    isPositive: boolean;
    /** 是否为负数 */
    isNegative: boolean;
    /** 是否为零 */
    isZero: boolean;
    /** 数值符号：1(正) | -1(负) | 0(零) */
    numeric: 1 | -1 | 0;
  };
  /** 是否为 NaN */
  isNaN: boolean;
  /** 最终解析的格式化选项 */
  resolvedOptions: ResolvedFormatOptions;
}

/**
 * NumberFormat 组件的 Props
 *
 * @description NumberFormat 组件的属性配置
 *
 * @example
 * ```tsx
 * // 基础用法
 * <NumberFormat value={1234.56} style="currency" currency="CNY" />
 *
 * // 函数式 children
 * <NumberFormat value={0.1234} style="percent">
 *   {(result) => (
 *     <span className={result.sign.isPositive ? 'text-green' : 'text-red'}>
 *       {result.formattedValue}
 *     </span>
 *   )}
 * </NumberFormat>
 *
 * // asChild 模式
 * <NumberFormat value={42} asChild>
 *   <button>Count: </button>
 * </NumberFormat>
 * ```
 */
export interface AutoNumberProps extends Omit<Intl.NumberFormatOptions, 'style'> {
  /** 要格式化的数值 */
  value: unknown;
  /** 语言环境，支持字符串或字符串数组 */
  locale?: string | string[];
  /** 是否显示符号（+/-） */
  includeSign?: boolean;
  /** 格式化样式，支持原生 Intl 样式和插件扩展样式 */
  style?: ExtendedStyle;
  /** CSS 类名 */
  className?: string;
  /** NaN 时的回退内容（已弃用，fallback 现在自动处理） */
  fallback?: ReactNode;
  /** 是否作为子组件渲染（Slot 模式） */
  asChild?: boolean;
  /** 函数式子组件，接收格式化结果 */
  children?: (result: UseFormatResult) => ReactNode;
}

/**
 * createNumberFormat 工厂函数的配置选项
 *
 * @description 用于非 React 环境的数字格式化器创建配置
 *
 * @example
 * ```tsx
 * // 创建格式化器
 * const formatter = createNumberFormat({
 *   style: 'currency',
 *   currency: 'USD',
 *   contextDefaults: {
 *     locale: 'en-US',
 *     useGrouping: true
 *   }
 * });
 *
 * const result = formatter.format(1234.56);
 * console.log(result.formattedValue); // "$1,234.56"
 * ```
 */
export interface CreateNumberFormatOptions
  extends Omit<Intl.NumberFormatOptions, 'style'>,
    CoreExtensionOptions {
  /** 语言环境，支持字符串或字符串数组 */
  locale?: string | string[];
  /** 是否显示符号（+/-） */
  includeSign?: boolean;
  /** 格式化样式，支持原生 Intl 样式和插件扩展样式 */
  style?: ExtendedStyle;
  /** 可选的上下文配置，用于非 React 环境 */
  contextDefaults?: NumberFormatContextValue;
}

/**
 * 数字格式化器接口
 *
 * @description 格式化器对象的标准接口
 *
 * @example
 * ```tsx
 * const formatter: NumberFormatter = createNumberFormat({
 *   style: 'decimal',
 *   maximumFractionDigits: 2
 * });
 *
 * const result = formatter.format(3.14159);
 * console.log(result.formattedValue); // "3.14"
 * ```
 */
export interface NumberFormatter {
  /** 格式化函数，接收数值并返回格式化结果 */
  format: (value: unknown) => UseFormatResult;
  /** 解析最终的格式化选项，不进行实际格式化 */
  resolveOptions: () => ResolvedFormatOptions;
}

/**
 * 解析后的格式化选项
 *
 * @description 包含所有最终生效的格式化配置，基于 Intl.ResolvedNumberFormatOptions
 *
 * @example
 * ```tsx
 * const resolved: ResolvedFormatOptions = {
 *   locale: "zh-CN",
 *   numberingSystem: "latn",
 *   style: "currency",
 *   currency: "CNY",
 *   currencyDisplay: "symbol",
 *   currencySign: "standard",
 *   minimumIntegerDigits: 1,
 *   minimumFractionDigits: 2,
 *   maximumFractionDigits: 2,
 *   useGrouping: "auto",
 *   notation: "standard",
 *   signDisplay: "auto",
 *   compactDisplay: "short",
 *   roundingMode: "halfExpand",
 *   roundingPriority: "auto",
 *   roundingIncrement: 1,
 *   trailingZeroDisplay: "auto",
 *   includeSign: false,
 *   originalStyle: "currency"
 * };
 * ```
 */
export interface ResolvedFormatOptions extends Intl.ResolvedNumberFormatOptions {
  /** 是否显示符号 */
  includeSign: boolean;
  /** 原始样式（包含插件扩展样式） */
  originalStyle?: ExtendedStyle;
}
