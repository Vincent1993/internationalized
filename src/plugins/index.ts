/**
 * @file 插件系统公共 API
 */

// ==================== 插件管理 API ====================
export {
  registerPlugin,
  registerGroup,
  unregisterPlugin,
  unregisterGroup,
  setPluginEnabled,
  setGroupEnabled,
  getRegisteredPlugins,
  getPluginInfo,
  getPluginRegistry,
  resetPlugins,
  clearRegisteredPlugins,
} from './registry';

// ==================== 内置插件 ====================
export { perMillePluginGroup } from './per-mille';
export { perMyriadPluginGroup } from './per-myriad';
export { percentagePointPluginGroup } from './percentage-point';
export { chineseUppercasePluginGroup } from './chinese-uppercase';
export { toChineseUppercase } from './chinese-uppercase';
export { fallbackPlugin, createFallbackPlugin } from './fallback';
export { fixDecimalsPlugin } from './fix-decimals';
export { dynamicDecimalPrecisionPlugin } from './dynamic-decimals';

// ==================== 类型定义 ====================
export type {
  FormatPlugin,
  PluginGroup,
  PluginRegistration,
  PluginExecutionContext,
  PluginPhase,
  PluginProcessor,
  ExtendedStyle,
  BaseFormatter,
  InputValueState,
  DynamicDecimalControlOptions,
} from './types';

export type {
  FallbackStrategy,
  StyleFallbackConfig,
  GlobalFallbackConfig,
  ContextAwareFallbackConfig,
} from './fallback';
