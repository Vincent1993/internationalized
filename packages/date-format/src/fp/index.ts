/**
 * @file 日期与时间的函数式 API 入口。
 * @description 提供与 React 组件同源的纯函数能力，便于在服务端与脚本环境复用。
 */

export {
  formatAsDate,
  formatAsDateEx,
  formatAsTime,
  formatAsTimeEx,
  formatAsDateTime,
  formatAsDateTimeEx,
  formatAsDateTimeWithSeconds,
  formatAsDateTimeWithSecondsEx,
  formatAsWeekday,
  formatAsWeekdayEx,
  formatAsMonthDay,
  formatAsMonthDayEx,
  formatAsMonth,
  formatAsMonthEx,
  formatAsStartOfDay,
  formatAsStartOfDayEx,
  formatAsEndOfDay,
  formatAsEndOfDayEx,
  formatDateRange,
  formatDateRangeEx,
  type FormatDateRangeResult,
} from './formatters';

export {
  config,
  resetDefaultConfigs,
  updateDefaultConfig,
  updateDefaultConfigs,
  getDefaultConfigs,
  type FormatterDefaults,
} from './defaults';

export {
  clearAllFPCaches,
  clearFormatterCache,
  getFPCacheStats,
} from './memoize';
