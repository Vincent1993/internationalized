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
  formatAsPerMyriad,
  formatAsPercentagePoint,
  formatAsChineseUppercase,
  formatAsCompact,
  formatAsScientific,
  formatAsDecimalEx,
  formatAsIntegerEx,
  formatAsCurrencyEx,
  formatAsPercentEx,
  formatAsPerMilleEx,
  formatAsPerMyriadEx,
  formatAsPercentagePointEx,
  formatAsChineseUppercaseEx,
  formatAsCompactEx,
  formatAsScientificEx,
} from './formatters';

// 模板格式化
export { formatWithTemplate, formatWithTemplateEx } from './templates';

// 解析函数
export {
  parseDecimal,
  parseInteger,
  parseCurrency,
  parsePercent,
  parsePerMille,
  parsePerMyriad,
  parsePercentagePoint,
  parseChineseUppercase,
  parseCompact,
  parseScientific,
  parseAuto,
} from './parsers';

// 缓存管理
export { clearAllFPCaches, clearCache, clearFormatterCache, clearParserCache } from './memoize';

// 配置管理
export { config, resetDefaultConfigs, type FormatterDefaults } from './defaults';

// 模板配置
export {
  configTemplates,
  resetTemplateConfig,
  type TemplateConfigState,
  type TemplateConfigEntry,
  type TemplateConfigurationInput,
} from './templates';

// 核心类型
export type { ParseResult, ParseOptions } from '../core/parser';
