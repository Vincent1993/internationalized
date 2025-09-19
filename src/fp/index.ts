/**
 * @file 函数式编程 (FP) 入口点
 * @description
 *   为常见的数字格式化任务提供纯粹的、无副作用的函数。
 */

// 格式化函数
export {
  formatAsDecimal,
  formatAsInteger,
  formatAsCurrency,
  formatAsPercent,
  formatAsPerMille,
  formatAsCompact,
  formatAsScientific,
  formatAsDecimalEx,
  formatAsIntegerEx,
  formatAsCurrencyEx,
  formatAsPercentEx,
  formatAsPerMilleEx,
  formatAsCompactEx,
  formatAsScientificEx,
} from './formatters';

// 解析函数
export {
  parseDecimal,
  parseInteger,
  parseCurrency,
  parsePercent,
  parsePerMille,
  parseCompact,
  parseScientific,
  parseAuto,
} from './parsers';

// 缓存管理
export { clearAllFPCaches, clearCache, clearFormatterCache, clearParserCache } from './memoize';

// 配置管理
export { config, resetDefaultConfigs, type FormatterDefaults } from './defaults';

// 模板格式化
export {
  formatWithTemplate,
  resolveTemplateOptions,
  configureFormatTemplate,
  registerTemplateHandler,
  unregisterTemplateHandler,
  registerPluginTemplateHandlers,
  unregisterPluginTemplateHandlers,
  resetFormatTemplateConfig,
  setTemplateTypeDefaults,
  type FormatTemplateResolution,
  type TemplateHandler,
  type TemplatePluginHandler,
  type TemplatePluginRegistration,
  type FormatTemplateConfig,
} from './template';

// 核心类型
export type { ParseResult, ParseOptions } from '../core/parser';
