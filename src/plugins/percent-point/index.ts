/**
 * @file 百分点（Percentage Point）功能插件组
 * @description 将增量百分比的数值单位抽象为插件，保持核心格式化逻辑的简洁。
 */

import Big from 'big.js';
import type {
  FormatPlugin,
  PluginExecutionContext,
  PluginGroup,
  ParseExecutionContext,
} from '../types';

const PERCENT_POINT_STYLE = 'percent-point';
const PERCENT_POINT_SUFFIX = '个百分点';
const PERCENT_POINT_MULTIPLIER = 100;
const PERCENT_POINT_SUFFIX_PATTERN = /(个?百分点|個?百分點|pp)$/iu;

function stripPercentPointSuffix(input: string): string {
  return input.replace(PERCENT_POINT_SUFFIX_PATTERN, '').trim();
}

/**
 * **预处理插件**
 * 负责将值乘以 100 并转换样式为 decimal。
 */
const percentPointValueProcessor: FormatPlugin = {
  name: 'percent-point-value-processor',
  version: '2.0.0',
  description: '处理百分点单位的值和选项（格式化与解析）',
  priority: 100,
  phase: 'pre-process',
  isApplicable: (context: PluginExecutionContext | ParseExecutionContext) =>
    context.style === PERCENT_POINT_STYLE,
  processValue: (value: number) => Big(value).mul(PERCENT_POINT_MULTIPLIER).toNumber(),
  processOptions: (options: Intl.NumberFormatOptions) => {
    const { style, ...restOptions } = options;
    return { ...restOptions, style: 'decimal' };
  },
  processParseInput: (input: string, context?: ParseExecutionContext) => {
    if (context?.strict) return input;
    return stripPercentPointSuffix(input);
  },
  processParseResult: (result, context) => {
    if (!result.success) return result;
    if (context?.strict) return result;
    const value = Big(result.value).div(PERCENT_POINT_MULTIPLIER).toNumber();
    return { ...result, value };
  },
};

/**
 * **后处理插件**
 * 负责在结果后添加 “个百分点” 文案。
 */
const percentPointSuffixAppender: FormatPlugin = {
  name: 'percent-point-suffix-appender',
  version: '2.0.0',
  description: '为百分点结果追加“个百分点”单位',
  priority: 100,
  phase: 'post-process',
  isApplicable: (context: PluginExecutionContext | ParseExecutionContext) =>
    context.style === PERCENT_POINT_STYLE,
  processResult: (formattedValue, parts) => ({
    formattedValue: `${formattedValue}${PERCENT_POINT_SUFFIX}`,
    parts: [...parts, { type: 'literal', value: PERCENT_POINT_SUFFIX }],
  }),
};

/**
 * **百分点插件组**
 * 聚合前后处理插件，统一注册。
 */
export const percentPointPluginGroup: PluginGroup = {
  name: PERCENT_POINT_STYLE,
  plugins: [percentPointValueProcessor, percentPointSuffixAppender],
};
