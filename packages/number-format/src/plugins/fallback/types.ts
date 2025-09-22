/**
 * @file Fallback 插件相关类型定义
 */

import type { ExtendedStyle } from '../types';

/**
 * 定义了当数值为无效状态（null, undefined, NaN, Infinity）时的回退展示策略。
 *
 * @example
 * // 一个货币格式的回退策略
 * const currencyStrategy: FallbackStrategy = {
 *   onNull: '--',
 *   onNaN: '无效金额',
 *   preserveFormatting: true, // 保留货币符号，如 ¥
 * };
 *
 * // 一个百分比格式的回退策略
 * const percentStrategy: FallbackStrategy = {
 *   onNull: '--%',
 *   onNaN: 'N/A',
 *   preserveFormatting: false, // 通常百分比符号已包含在 onNull 等字段中
 * };
 */
export interface FallbackStrategy {
  /** 当值为 `null` 时的展示内容。 @default '-' */
  onNull?: string;
  /** 当值为 `undefined` 时的展示内容。 @default '-' */
  onUndefined?: string;
  /** 当值为 `NaN` 时的展示内容。 @default 'NaN' */
  onNaN?: string;
  /** 当值为 `Infinity` 时的展示内容。 @default '∞' */
  onInfinity?: string;
  /** 当值为 `-Infinity` 时的展示内容。 @default '-∞' */
  onNegativeInfinity?: string;
  /**
   * 是否保留原有的前缀和后缀符号（如货币符号、单位等）。
   *
   * @default false
   */
  preserveFormatting?: boolean;
}

/**
 * 针对特定格式化样式（`style`）的 Fallback 配置。
 */
export interface StyleFallbackConfig {
  /** 目标样式类型，如 'currency', 'percent' 等。 */
  style: ExtendedStyle;
  /** 该样式下要应用的具体回退策略。 */
  strategy: FallbackStrategy;
}

/**
 * 全局 Fallback 配置，用于 `createFallbackPlugin`。
 */
export interface GlobalFallbackConfig {
  /**
   * 默认的回退策略。
   * 当没有为特定样式找到策略时，将使用此策略。
   */
  defaultStrategy?: FallbackStrategy;
  /**
   * 一个包含针对不同样式的特定策略的数组。
   */
  styleStrategies?: StyleFallbackConfig[];
}

/**
 * 上下文感知的完整 Fallback 配置，增加了启用开关。
 */
export interface ContextAwareFallbackConfig extends GlobalFallbackConfig {
  /**
   * 是否启用 fallback 功能。
   * 如果设置为 `false`，整个 fallback 插件将不执行任何操作。
   *
   * @default true
   */
  enabled?: boolean;
}

export type { ExtendedStyle };
