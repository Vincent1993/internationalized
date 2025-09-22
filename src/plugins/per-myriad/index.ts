/**
 * @file 万分位（Per-myriad）功能插件组
 * @description 通过一个插件组来统一管理万分位功能的两个核心插件。
 */

import Big from 'big.js';
import type {
  FormatPlugin,
  PluginExecutionContext,
  PluginGroup,
  ParseExecutionContext,
} from '../types';

const PER_MYRIAD_STYLE = 'per-myriad';
const PER_MYRIAD_SYMBOL = '‱';
const PER_MYRIAD_MULTIPLIER = 10000;

/**
 * **预处理插件**
 * 负责将值乘以 10000 并转换样式为 decimal。
 */
const perMyriadValueProcessor: FormatPlugin = {
  name: 'per-myriad-value-processor',
  version: '2.0.0',
  description: '处理万分位的值和选项（格式化与解析）',
  priority: 100,
  phase: 'pre-process',
  isApplicable: (context: PluginExecutionContext | ParseExecutionContext) =>
    context.style === PER_MYRIAD_STYLE,
  processValue: (value: number) => Big(value).mul(PER_MYRIAD_MULTIPLIER).toNumber(),
  processOptions: (options: Intl.NumberFormatOptions) => {
    const { style, ...restOptions } = options;
    return { ...restOptions, style: 'decimal' };
  },
  processParseInput: (input: string, context?: ParseExecutionContext) => {
    if (context?.strict) return input;
    return input.replace(new RegExp(`${PER_MYRIAD_SYMBOL}$`, 'u'), '').trim();
  },
  processParseResult: (result, context) => {
    if (!result.success) return result;
    if (context?.strict) return result;
    const value = Big(result.value).div(PER_MYRIAD_MULTIPLIER).toNumber();
    return { ...result, value };
  },
};

/**
 * **后处理插件**
 * 负责在结果后添加 ‱ 符号。
 */
const perMyriadSymbolAppender: FormatPlugin = {
  name: 'per-myriad-symbol-appender',
  version: '2.0.0',
  description: '为万分位结果添加“‱”符号',
  priority: 100,
  phase: 'post-process',
  isApplicable: (context: PluginExecutionContext | ParseExecutionContext) =>
    context.style === PER_MYRIAD_STYLE,
  processResult: (formattedValue, parts) => ({
    formattedValue: `${formattedValue}${PER_MYRIAD_SYMBOL}`,
    parts: [...parts, { type: 'literal', value: PER_MYRIAD_SYMBOL }],
  }),
};

/**
 * **万分位插件组**
 * 将两个协同工作的插件打包成一个逻辑单元，便于统一注册和管理。
 */
export const perMyriadPluginGroup: PluginGroup = {
  name: PER_MYRIAD_STYLE,
  plugins: [perMyriadValueProcessor, perMyriadSymbolAppender],
};
