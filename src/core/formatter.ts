import { getPluginRegistry } from '../plugins';
import { createCacheKey } from '../utils/cache-key';
import type { PluginExecutionContext, BaseFormatter, CoreExtensionOptions } from '../plugins/types';
import { detectValueState, VALUE_STATE } from './utils';
import type {
  UseFormatOptions,
  UseFormatResult,
  NumberFormatContextValue,
  CreateNumberFormatOptions,
  NumberFormatter,
  ResolvedFormatOptions,
} from './types';

/**
 * 创建插件执行上下文
 */
function createPluginContext(
  originalValue: unknown,
  currentValue: number,
  style: UseFormatOptions['style'],
  options: Intl.NumberFormatOptions,
  extend?: CoreExtensionOptions,
): PluginExecutionContext {
  return {
    originalValue,
    currentValue,
    style,
    options: Object.freeze({ ...options }),
    valueState: detectValueState(originalValue),
    extend: extend ? Object.freeze({ ...extend }) : undefined,
  };
}

function createIntlFormatterCacheKey(
  locale: string,
  options: Intl.NumberFormatOptions,
): string {
  const normalizedOptions = { ...options } as Record<string, unknown>;
  return createCacheKey(normalizedOptions, { prefix: locale });
}

/**
 * 应用格式化插件（统一处理有效值、无效值与异常场景）
 */
function applyFormatPlugins(
  originalInput: unknown,
  style: UseFormatOptions['style'],
  options: Intl.NumberFormatOptions,
  baseFormatter: BaseFormatter,
  extend?: CoreExtensionOptions,
): {
  formattedValue: string;
  parts: Intl.NumberFormatPart[];
  usedNumericValue: number;
  isInvalidOrErrored: boolean;
} {
  const pluginRegistry = getPluginRegistry();

  // 初始化上下文与数值
  const initialNumericValue = Number(originalInput);
  let currentValue = initialNumericValue;
  let processedOptions = { ...options };
  let context = createPluginContext(originalInput, currentValue, style, processedOptions, extend);

  try {
    // --- 阶段 1: 预处理 ---
    pluginRegistry.getPluginsForPhase('pre-process', context).forEach((plugin) => {
      if (plugin.processValue) {
        currentValue = plugin.processValue(currentValue, context);
        context = createPluginContext(originalInput, currentValue, style, processedOptions, extend);
      }
      if (plugin.processOptions) {
        processedOptions = plugin.processOptions(processedOptions, context);
        context = createPluginContext(originalInput, currentValue, style, processedOptions, extend);
      }
    });

    const finalContext = createPluginContext(
      originalInput,
      currentValue,
      style,
      processedOptions,
      extend,
    );

    // --- 阶段 2: 基础格式化 ---
    const baseResult = baseFormatter(currentValue, processedOptions);

    // --- 阶段 3 & 4: format + post-process ---
    function runProcessResultPlugins(
      inputResult: { formattedValue: string; parts: Intl.NumberFormatPart[] },
      phase: 'format' | 'post-process',
    ) {
      const plugins = pluginRegistry.getPluginsForPhase(phase, finalContext);
      let acc = inputResult;
      for (const plugin of plugins) {
        if (plugin.processResult) {
          acc = plugin.processResult(acc.formattedValue, acc.parts, finalContext);
        }
      }
      return acc;
    }

    const resultAfterFormat = runProcessResultPlugins(baseResult, 'format');
    const finalResult = runProcessResultPlugins(resultAfterFormat, 'post-process');
    const isInvalid = detectValueState(originalInput) !== VALUE_STATE.VALID;

    return { ...finalResult, usedNumericValue: currentValue, isInvalidOrErrored: isInvalid };
  } catch (_error) {
    // 异常：仅走 post-process 链路
    const errorContext = createPluginContext(
      originalInput,
      currentValue,
      style,
      processedOptions,
      extend,
    );
    const plugins = pluginRegistry.getPluginsForPhase('post-process', errorContext);
    let acc: { formattedValue: string; parts: Intl.NumberFormatPart[] } = {
      formattedValue: 'NaN',
      parts: [{ type: 'literal', value: 'NaN' }],
    };
    for (const plugin of plugins) {
      if (plugin.processResult) {
        acc = plugin.processResult(acc.formattedValue, acc.parts, errorContext);
      }
    }
    return { ...acc, usedNumericValue: currentValue, isInvalidOrErrored: true };
  }
}

/**
 * @name 解析格式化选项
 * @description 解析并返回最终的格式化配置选项，与 Intl.NumberFormat.resolvedOptions() 合并
 * @param options - 格式化配置选项
 * @param contextDefaults - 可选的上下文默认配置
 * @returns 解析后的格式化选项
 *
 * @example
 * ```tsx
 * // 基础用法
 * const resolved = resolveFormatOptions({
 *   style: 'currency',
 *   currency: 'CNY',
 *   maximumFractionDigits: 2
 * });
 * console.log(resolved.style); // "currency"
 * console.log(resolved.currency); // "CNY"
 * console.log(resolved.locale); // "zh-CN"
 * console.log(resolved.numberingSystem); // "latn" (来自 Intl 解析)
 *
 * // 带上下文默认配置
 * const contextDefaults = {
 *   locale: 'en-US',
 *   useGrouping: false
 * };
 * const resolvedWithContext = resolveFormatOptions({
 *   style: 'percent'
 * }, contextDefaults);
 * console.log(resolvedWithContext.locale); // "en-US"
 * console.log(resolvedWithContext.useGrouping); // false
 * console.log(resolvedWithContext.style); // "percent"
 *
 * // 检查插件扩展样式
 * const resolvedPermille = resolveFormatOptions({ style: 'per-mille' });
 * console.log(resolvedPermille.originalStyle); // "per-mille"
 * console.log(resolvedPermille.style); // "decimal" (插件内部转换)
 * console.log(resolvedPermille.compactDisplay); // "short" (来自 Intl 默认值)
 * ```
 */
export function resolveFormatOptions(
  options: UseFormatOptions,
  contextDefaults?: NumberFormatContextValue | null,
): ResolvedFormatOptions {
  const { locale, includeSign, style, ...intlOptions } = options;

  // 合并配置选项
  const {
    includeSign: contextIncludeSign,
    locale: contextLocale,
    style: contextStyle,
    ...contextIntlOptions
  } = contextDefaults || {};

  // 获取最终的style
  const finalStyle = style ?? contextStyle;

  // 构建基础的 Intl.NumberFormatOptions（为插件处理做准备）
  const baseOptions: Intl.NumberFormatOptions = {
    useGrouping: true,
    ...contextIntlOptions,
    ...intlOptions,
    style: finalStyle as Intl.NumberFormatOptions['style'], // 插件会处理扩展类型
  };

  // 符号显示策略改由插件处理（extend-sign）。此处仅保留 legacy includeSign 的元数据。
  const shouldIncludeSign = includeSign ?? contextIncludeSign ?? false;

  const finalLocale = locale || contextLocale || 'zh-CN';

  // 创建 Intl.NumberFormat 实例获取真实的解析选项
  let intlResolvedOptions: Intl.ResolvedNumberFormatOptions;

  try {
    // 对于插件扩展样式，需要转换为标准样式
    const resolveOptions = { ...baseOptions };
    if (finalStyle && !['decimal', 'currency', 'percent', 'unit'].includes(finalStyle)) {
      // 插件扩展样式转换为 decimal
      resolveOptions.style = 'decimal';
    }

    const formatter = new Intl.NumberFormat(finalLocale, resolveOptions);
    intlResolvedOptions = formatter.resolvedOptions();
  } catch (error) {
    // 如果创建失败，使用默认配置
    console.warn('Failed to resolve Intl.NumberFormat options:', error);
    const fallbackFormatter = new Intl.NumberFormat(finalLocale, { style: 'decimal' });
    intlResolvedOptions = fallbackFormatter.resolvedOptions();
  }

  // 合并 Intl 解析的选项和我们的自定义配置
  return {
    ...intlResolvedOptions,
    includeSign: shouldIncludeSign,
    originalStyle: finalStyle,
  };
}

/**
 * @name 创建核心格式化器函数
 * @description 创建格式化器的核心逻辑
 * @param options - 格式化配置选项
 * @param contextDefaults - 可选的上下文默认配置
 * @returns 格式化函数，接收数值并返回格式化结果
 *
 * @example
 * ```tsx
 * // 创建基础格式化器
 * const formatter = createFormatterCore({
 *   style: 'currency',
 *   currency: 'CNY',
 *   minimumFractionDigits: 2
 * });
 *
 * const result = formatter(1234.5);
 * console.log(result.formattedValue); // "¥1,234.50"
 * console.log(result.sign.isPositive); // true
 * console.log(result.parts); // NumberFormatPart[]
 * console.log(result.resolvedOptions); // { style: 'currency', currency: 'CNY', locale: 'zh-CN', ... }
 *
 * // 带上下文默认配置
 * const contextDefaults = {
 *   locale: 'en-US',
 *   useGrouping: true
 * };
 *
 * const formatterWithContext = createFormatterCore({
 *   style: 'decimal',
 *   maximumFractionDigits: 2
 * }, contextDefaults);
 *
 * const result2 = formatterWithContext(123.456);
 * console.log(result2.resolvedOptions.locale); // 'en-US'
 * console.log(result2.resolvedOptions.useGrouping); // true
 * console.log(result2.resolvedOptions.maximumFractionDigits); // 2
 * ```
 */
export function createFormatterCore(
  options: UseFormatOptions,
  contextDefaults?: NumberFormatContextValue | null,
): NumberFormatter {
  const intlFormatterCache = new Map<string, Intl.NumberFormat>();

  const getCachedIntlFormatter = (
    locale: string,
    opts: Intl.NumberFormatOptions,
  ): Intl.NumberFormat => {
    const cacheKey = createIntlFormatterCacheKey(locale, opts);
    const cached = intlFormatterCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const formatter = new Intl.NumberFormat(locale, opts);
    intlFormatterCache.set(cacheKey, formatter);
    return formatter;
  };

  let resolvedOptionsCache: ResolvedFormatOptions | null = null;
  const getResolvedOptions = (): ResolvedFormatOptions => {
    if (!resolvedOptionsCache) {
      resolvedOptionsCache = resolveFormatOptions(options, contextDefaults);
    }
    return resolvedOptionsCache;
  };

  const extractExtend = (opts: UseFormatOptions, ctx?: NumberFormatContextValue | null) => {
    const extend: CoreExtensionOptions = {
      extend_includeSign: opts.extend_includeSign ?? ctx?.extend_includeSign,
      extend_signZeroMode: opts.extend_signZeroMode ?? ctx?.extend_signZeroMode,
      extend_negativeZero: opts.extend_negativeZero ?? ctx?.extend_negativeZero,
      extend_fixDecimals: opts.extend_fixDecimals ?? ctx?.extend_fixDecimals,
    };
    return extend;
  };
  const memoizedExtendOptions = extractExtend(options, contextDefaults || null);

  const format = (value: unknown): UseFormatResult => {
    const resolvedOptions = getResolvedOptions();
    const { originalStyle, locale, ...intlOptions } = resolvedOptions;

    const numericValueRaw = Number(value);
    const numericSign: 1 | -1 | 0 = numericValueRaw > 0 ? 1 : numericValueRaw < 0 ? -1 : 0;
    const sign = {
      isPositive: numericSign === 1,
      isNegative: numericSign === -1,
      isZero: numericSign === 0,
      numeric: numericSign,
    };

    // 统一经由 applyFormatPlugins 处理（含无效值与异常）
    const baseFormatter: BaseFormatter = (val, opts) => {
      const formatter = getCachedIntlFormatter(locale, opts);
      return {
        formattedValue: formatter.format(val),
        parts: formatter.formatToParts(val),
      };
    };

    const { formattedValue, parts, usedNumericValue, isInvalidOrErrored } = applyFormatPlugins(
      value,
      originalStyle,
      { ...intlOptions },
      baseFormatter,
      memoizedExtendOptions,
    );

    return {
      value: usedNumericValue,
      formattedValue,
      parts,
      sign,
      isNaN: isInvalidOrErrored,
      resolvedOptions: { ...resolvedOptions },
    };
  };

  return {
    format,
    resolveOptions: () => ({ ...getResolvedOptions() }),
  };
}

// 全局默认配置存储
let globalDefaults: NumberFormatContextValue | null = null;

/**
 * @name 创建可复用的数字格式化器
 *
 * @description 工厂函数，用于在非 React 环境中创建数字格式化器
 * 支持全局默认配置和局部配置的合并
 *
 * @param options - 格式化配置选项，可包含上下文默认配置
 * @returns 包含 format 方法的格式化器对象
 *
 * @example
 * ```tsx
 * // 基础用法
 * const formatter = createNumberFormat({
 *   style: 'currency',
 *   currency: 'USD',
 *   minimumFractionDigits: 2
 * });
 *
 * const result = formatter.format(1234.56);
 * console.log(result.formattedValue); // "$1,234.56"
 * console.log(result.resolvedOptions.currency); // "USD"
 * console.log(result.resolvedOptions.style); // "currency"
 * console.log(result.resolvedOptions.locale); // "zh-CN" (默认)
 *
 * // 带上下文默认配置
 * const formatterWithDefaults = createNumberFormat({
 *   style: 'decimal',
 *   maximumFractionDigits: 2,
 *   contextDefaults: {
 *     locale: 'zh-CN',
 *     useGrouping: true
 *   }
 * });
 *
 * // 设置全局默认配置
 * createNumberFormat.defaults({
 *   locale: 'en-US',
 *   useGrouping: true,
 *   style: 'decimal'
 * });
 *
 * // 全局配置会被自动应用
 * const globalFormatter = createNumberFormat({
 *   maximumFractionDigits: 2
 * });
 *
 * // 在 Node.js 环境中使用
 * import { createNumberFormat } from '@your-package/number-format';
 *
 * const priceFormatter = createNumberFormat({
 *   style: 'currency',
 *   currency: 'CNY'
 * });
 *
 * // 格式化价格数据
 * const prices = [99.99, 199.5, 299];
 * const formattedPrices = prices.map(price =>
 *   priceFormatter.format(price).formattedValue
 * );
 * console.log(formattedPrices); // ["¥99.99", "¥199.50", "¥299.00"]
 * ```
 */
export const createNumberFormat = (options: CreateNumberFormatOptions = {}): NumberFormatter => {
  const { contextDefaults, ...formatterOptions } = options;

  // 合并全局默认配置和局部配置
  const mergedDefaults = {
    ...globalDefaults,
    ...contextDefaults,
  };

  const core = createFormatterCore(formatterOptions, mergedDefaults);

  return {
    format: core.format,
    resolveOptions: core.resolveOptions,
  };
};

/**
 * @name 设置或清除全局默认配置
 *
 * @description 为 createNumberFormat 设置全局默认配置，影响后续创建的所有格式化器
 *
 * @param defaults - 默认配置，传入 null 则清除全局配置
 *
 * @example
 * ```tsx
 * // 设置全局默认配置
 * createNumberFormat.defaults({
 *   locale: 'zh-CN',
 *   useGrouping: true,
 *   style: 'decimal'
 * });
 *
 * // 后续创建的格式化器会自动应用全局配置
 * const formatter1 = createNumberFormat({ maximumFractionDigits: 2 });
 * const formatter2 = createNumberFormat({ style: 'percent' });
 *
 * // 清除全局配置
 * createNumberFormat.defaults(null);
 * ```
 */
createNumberFormat.defaults = (defaults: NumberFormatContextValue | null): void => {
  globalDefaults = defaults;
};
