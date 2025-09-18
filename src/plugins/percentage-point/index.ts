/**
 * @file 百分点（Percentage point, pp）插件组
 * @description 通过插件组合实现百分点格式化与解析能力。
 */

import Big from 'big.js';
import type {
  FormatPlugin,
  PluginExecutionContext,
  ParseExecutionContext,
  PluginGroup,
} from '../types';

const PERCENTAGE_POINT_STYLE = 'percentage-point';
const PP_SYMBOL = 'pp';
const MULTIPLIER = 100;

const percentagePointProcessor: FormatPlugin = {
  name: 'percentage-point-processor',
  version: '2.0.0',
  description: '处理百分点格式的值、选项与解析',
  priority: 100,
  phase: 'pre-process',
  isApplicable: (context: PluginExecutionContext | ParseExecutionContext) =>
    context.style === PERCENTAGE_POINT_STYLE,
  processValue: (value: number) => Big(value).mul(MULTIPLIER).toNumber(),
  processOptions: (options: Intl.NumberFormatOptions) => {
    const { style, ...rest } = options;
    return { ...rest, style: 'decimal' };
  },
  processParseInput: (input: string, context?: ParseExecutionContext) => {
    if (context?.strict) return input;
    return input.replace(/pp$/iu, '').trim();
  },
  processParseResult: (result, context) => {
    if (!result.success) return result;
    if (context?.strict) return result;
    const value = Big(result.value).div(MULTIPLIER).toNumber();
    return { ...result, value };
  },
};

const percentagePointSymbolAppender: FormatPlugin = {
  name: 'percentage-point-symbol-appender',
  version: '2.0.0',
  description: '为百分点结果追加"pp"后缀',
  priority: 150,
  phase: 'post-process',
  isApplicable: (context: PluginExecutionContext | ParseExecutionContext) =>
    context.style === PERCENTAGE_POINT_STYLE,
  processResult: (formattedValue, parts) => ({
    formattedValue: `${formattedValue}${PP_SYMBOL}`,
    parts: [...parts, { type: 'literal', value: PP_SYMBOL }],
  }),
};

export const percentagePointPluginGroup: PluginGroup = {
  name: PERCENTAGE_POINT_STYLE,
  plugins: [percentagePointProcessor, percentagePointSymbolAppender],
};
