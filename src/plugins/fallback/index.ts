/**
 * @file Fallback 插件 (v4.0)
 * @description
 *   一个纯粹的后处理插件，负责在输入值为无效状态时，提供优雅的回退展示。
 *   其核心职责是根据配置策略，生成最终的回退字符串和 parts。
 */

import { VALUE_STATE } from '../../core/utils';
import type { FormatPlugin, PluginExecutionContext, ExtendedStyle } from '../types';
import type { FallbackStrategy, ContextAwareFallbackConfig } from './types';
import { DEFAULT_GLOBAL_FALLBACK_CONFIG } from './config';

const formatterCache = new Map<string, Intl.NumberFormat>();

function getSampleFormatter(options: Intl.NumberFormatOptions): Intl.NumberFormat | undefined {
  const cacheKey = `default:${JSON.stringify(options)}`;
  if (formatterCache.has(cacheKey)) {
    return formatterCache.get(cacheKey);
  }

  try {
    const formatter = new Intl.NumberFormat(undefined, options);
    formatterCache.set(cacheKey, formatter);
    return formatter;
  } catch (error) {
    console.warn('FallbackPlugin: Failed to create sample formatter', error);
    formatterCache.set(cacheKey, undefined!);
    return undefined;
  }
}

function extractFormatParts(parts: Intl.NumberFormatPart[]): {
  prefixParts: Intl.NumberFormatPart[];
  suffixParts: Intl.NumberFormatPart[];
} {
  const prefixParts: Intl.NumberFormatPart[] = [];
  const suffixParts: Intl.NumberFormatPart[] = [];
  let numberFound = false;

  parts.forEach((part) => {
    if (['integer', 'decimal', 'fraction', 'nan', 'infinity'].includes(part.type)) {
      numberFound = true;
    } else if (!numberFound) {
      prefixParts.push(part);
    } else {
      suffixParts.push(part);
    }
  });
  return { prefixParts, suffixParts };
}

/**
 * 创建一个 Fallback 插件实例。
 */
export const createFallbackPlugin = (globalConfig?: ContextAwareFallbackConfig): FormatPlugin => {
  const config = { ...DEFAULT_GLOBAL_FALLBACK_CONFIG, ...globalConfig };
  const strategyMap = new Map<ExtendedStyle, FallbackStrategy>();

  config.styleStrategies?.forEach(({ style, strategy }) => {
    strategyMap.set(style, { ...config.defaultStrategy, ...strategy });
  });

  const getStrategy = (style?: ExtendedStyle): FallbackStrategy => {
    const defaultStrategy = config.defaultStrategy || {};
    if (style) {
      return strategyMap.get(style) || defaultStrategy;
    }
    return defaultStrategy;
  };

  return {
    name: 'fallback',
    version: '4.0.0',
    description: '统一架构的异常值回退处理插件',
    priority: 1,
    phase: 'post-process',

    isApplicable: (context: PluginExecutionContext): boolean => {
      return config.enabled !== false && context.valueState !== VALUE_STATE.VALID;
    },
    //@ts-ignore
    processResult: (
      _formattedValue: string,
      _parts: Intl.NumberFormatPart[],
      context: PluginExecutionContext,
    ) => {
      const { valueState, style, options } = context;
      const strategy = getStrategy(style);

      let fallbackText = '';
      switch (valueState) {
        case VALUE_STATE.NULL:
          fallbackText = strategy.onNull ?? '-';
          break;
        case VALUE_STATE.UNDEFINED:
          fallbackText = strategy.onUndefined ?? '-';
          break;
        case VALUE_STATE.NAN:
          fallbackText = strategy.onNaN ?? 'N/A';
          break;
        case VALUE_STATE.INFINITY:
          fallbackText = strategy.onInfinity ?? '∞';
          break;
        case VALUE_STATE.NEGATIVE_INFINITY:
          fallbackText = strategy.onNegativeInfinity ?? '-∞';
          break;
        case VALUE_STATE.VALID:
          return { formattedValue: _formattedValue, parts: _parts };
        default: {
          const exhaustiveCheck: never = valueState;
          void exhaustiveCheck;
          throw new Error('Unhandled value state');
        }
      }

      let prefixParts: Intl.NumberFormatPart[] = [];
      let suffixParts: Intl.NumberFormatPart[] = [];

      if (strategy.preserveFormatting) {
        const formatter = getSampleFormatter(options);
        if (formatter) {
          const sampleParts = formatter.formatToParts(0);
          const { prefixParts: extractedPrefix, suffixParts: extractedSuffix } =
            extractFormatParts(sampleParts);
          prefixParts = extractedPrefix;
          suffixParts = extractedSuffix;
        }
      }

      const prefix = prefixParts.map((p) => p.value).join('');
      const suffix = suffixParts.map((p) => p.value).join('');
      const formattedValue = `${prefix}${fallbackText}${suffix}`;

      const parts: Intl.NumberFormatPart[] = [
        ...prefixParts,
        { type: 'literal', value: fallbackText },
        ...suffixParts,
      ];

      return { formattedValue, parts };
    },
  };
};

/**
 * 默认导出的 Fallback 插件实例。
 */
export const fallbackPlugin = createFallbackPlugin();

/**
 * 导出类型
 */
export type {
  FallbackStrategy,
  StyleFallbackConfig,
  GlobalFallbackConfig,
  ContextAwareFallbackConfig,
} from './types';
