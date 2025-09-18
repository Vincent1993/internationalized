/**
 * @file Fallback 插件的默认配置
 */

import type { ExtendedStyle, ContextAwareFallbackConfig, FallbackStrategy } from './types';

/**
 * 为不同的格式化样式（`style`）提供默认的回退策略。
 *
 * 这些是插件的内置“最佳实践”配置，可以被用户提供的全局配置覆盖。
 */
export const DEFAULT_FALLBACK_STRATEGIES: Record<NonNullable<ExtendedStyle>, FallbackStrategy> = {
  /** 货币格式：保留符号，使用 '--' 和 '无效金额' */
  currency: {
    onNull: '--',
    onUndefined: '--',
    onNaN: '--',
    onInfinity: '--',
    onNegativeInfinity: '--',
    preserveFormatting: true,
  },
  /** 百分比格式：在回退文本中包含 '%' */
  percent: {
    onNull: '--',
    onUndefined: '--',
    onNaN: '--',
    onInfinity: '--',
    onNegativeInfinity: '--',
    preserveFormatting: true,
  },
  /** 千分比格式：在回退文本中包含 '‰' */
  'per-mille': {
    onNull: '--',
    onUndefined: '--',
    onNaN: '--',
    onInfinity: '--',
    onNegativeInfinity: '--',
    preserveFormatting: true,
  },
  /** 普通小数格式：使用简单的符号 */
  decimal: {
    onNull: 'N/A',
    onUndefined: 'N/A',
    onNaN: 'N/A',
    preserveFormatting: false,
  },
  /** 带单位格式：保留单位，使用 'N/A' */
  unit: {
    onNull: 'N/A',
    onUndefined: 'N/A',
    onNaN: 'N/A',
    onInfinity: 'N/A',
    onNegativeInfinity: 'N/A',
    preserveFormatting: true,
  },
};

/**
 * 默认的全局 Fallback 配置对象。
 *
 * 当 `createFallbackPlugin` 被调用且未提供任何参数时，将使用此配置。
 *
 * @example
 * import { fallbackPlugin } from './index'; // 使用此默认配置
 *
 * // 自定义插件时，此配置作为基础
 * const customPlugin = createFallbackPlugin({
 *   defaultStrategy: { onNull: 'N/A' },
 * });
 */
function isExtendedStyleKey(key: string): key is NonNullable<ExtendedStyle> {
  return Object.prototype.hasOwnProperty.call(DEFAULT_FALLBACK_STRATEGIES, key);
}

export const DEFAULT_GLOBAL_FALLBACK_CONFIG: ContextAwareFallbackConfig = {
  enabled: true,
  defaultStrategy: {
    onNull: '-',
    onUndefined: '-',
    onNaN: 'N/A',
    onInfinity: '∞',
    onNegativeInfinity: '-∞',
    preserveFormatting: false,
  },
  styleStrategies: Object.keys(DEFAULT_FALLBACK_STRATEGIES)
    .filter(isExtendedStyleKey)
    .map((style) => ({
      style,
      strategy: DEFAULT_FALLBACK_STRATEGIES[style],
    })),
};
