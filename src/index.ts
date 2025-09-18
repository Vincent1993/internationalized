/**
 * @file 主入口文件
 * @description 统一导出所有公共 API、组件、Hooks 和类型。
 */

// ==================== 组件 ====================
export { NumberFormat, AutoMetricNumber } from './components';
export { NumberFormatProvider } from './core/context';
export type { NumberFormatProps } from './components/NumberFormat';
export type { AutoMetricNumberProps } from './components/AutoMetricNumber';

// ==================== Hooks ====================
export { useFormat, useAutoFormat, useParse } from './hooks';
export type { UseAutoFormatOptions, UseParseOptions, UseParseResult } from './hooks';

// ==================== 核心 API ====================
export {
  createNumberFormat,
  resolveFormatOptions,
  resolveFormatTemplate,
  configureFormatTemplate,
  getFormatTemplateConfig,
  registerTemplateHandler,
  unregisterTemplateHandler,
  resetFormatTemplateConfig,
  setTemplateTypeDefaults,
} from './core';
export { createNumberParser, parseNumber } from './core/parser';

export type {
  MetricFormatRule,
  NumberFormatContextValue,
  UseFormatOptions,
  UseFormatResult,
  CreateNumberFormatOptions,
  NumberFormatter,
  ResolvedFormatOptions,
} from './core';

export type { ParseResult, ParseOptions, NumberParser } from './core/parser';

// ==================== 插件系统 ====================
export {
  registerPlugin,
  registerGroup,
  unregisterPlugin,
  unregisterGroup,
  setPluginEnabled,
  setGroupEnabled,
  getRegisteredPlugins,
  getPluginInfo,
  perMillePluginGroup,
  fallbackPlugin,
  createFallbackPlugin,
} from './plugins';
export type {
  FormatPlugin,
  PluginGroup,
  PluginRegistration,
  PluginExecutionContext,
  PluginPhase,
  PluginProcessor,
  ExtendedStyle,
  FallbackStrategy,
  StyleFallbackConfig,
  GlobalFallbackConfig,
  ContextAwareFallbackConfig,
  InputValueState,
} from './plugins';
