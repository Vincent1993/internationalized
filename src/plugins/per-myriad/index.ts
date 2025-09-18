/**
 * @file 万分比（Per-myriad/Basis point）插件组
 * @description 通过插件组合实现万分比格式化与解析能力。
 */

import Big from 'big.js';
import type {
  FormatPlugin,
  PluginExecutionContext,
  ParseExecutionContext,
  PluginGroup,
} from '../types';

const PER_MYRIAD_STYLE = 'per-myriad';
const BASIS_POINT_SYMBOL = '‱';
const MULTIPLIER = 10000;

const perMyriadValueProcessor: FormatPlugin = {
  name: 'per-myriad-value-processor',
  version: '2.0.0',
  description: '处理万分比的值和选项（格式化与解析）',
  priority: 100,
  phase: 'pre-process',
  isApplicable: (context: PluginExecutionContext | ParseExecutionContext) =>
    context.style === PER_MYRIAD_STYLE,
  processValue: (value: number) => Big(value).mul(MULTIPLIER).toNumber(),
  processOptions: (options: Intl.NumberFormatOptions) => {
    const { style, ...rest } = options;
    return { ...rest, style: 'decimal' };
  },
  processParseInput: (input: string, context?: ParseExecutionContext) => {
    if (context?.strict) return input;
    return input.replace(/‱$/u, '').trim();
  },
  processParseResult: (result, context) => {
    if (!result.success) return result;
    if (context?.strict) return result;
    const value = Big(result.value).div(MULTIPLIER).toNumber();
    return { ...result, value };
  },
};

const perMyriadSymbolAppender: FormatPlugin = {
  name: 'per-myriad-symbol-appender',
  version: '2.0.0',
  description: '为万分比结果追加“‱”符号',
  priority: 150,
  phase: 'post-process',
  isApplicable: (context: PluginExecutionContext | ParseExecutionContext) =>
    context.style === PER_MYRIAD_STYLE,
  processResult: (formattedValue, parts) => ({
    formattedValue: `${formattedValue}${BASIS_POINT_SYMBOL}`,
    parts: [...parts, { type: 'literal', value: BASIS_POINT_SYMBOL }],
  }),
};

export const perMyriadPluginGroup: PluginGroup = {
  name: PER_MYRIAD_STYLE,
  plugins: [perMyriadValueProcessor, perMyriadSymbolAppender],
};
