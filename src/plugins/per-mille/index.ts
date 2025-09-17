/**
 * @file 千分比（Per-mille）功能插件组
 * @description 通过一个插件组来统一管理千分比功能的两个核心插件。
 */

import Big from 'big.js';
import type {
  FormatPlugin,
  PluginExecutionContext,
  PluginGroup,
  ParseExecutionContext,
} from '../types';

const PER_MILLE_STYLE = 'per-mille';

/**
 * **预处理插件**
 * 负责将值乘以 1000 并转换样式为 decimal。
 */
const perMilleValueProcessor: FormatPlugin = {
  name: 'per-mille-value-processor',
  version: '2.0.0',
  description: '处理千分比的值和选项（格式化与解析）',
  priority: 100,
  phase: 'pre-process',
  isApplicable: (context: PluginExecutionContext | ParseExecutionContext) =>
    context.style === PER_MILLE_STYLE,
  processValue: (value: number) => Big(value).mul(1000).toNumber(),
  processOptions: (options: Intl.NumberFormatOptions) => {
    const { style, ...restOptions } = options;
    return { ...restOptions, style: 'decimal' };
  },

  // 解析：在解析前，将潜在的 “‰” 移除并归一化输入
  processParseInput: (input: string, context?: ParseExecutionContext) => {
    // 严格模式下，不移除符号，交由核心严格校验
    if (context?.strict) return input;
    return input.replace(/‰$/u, '').trim();
  },
  // 解析：在解析后，将结果从十进制换算为基数（/1000）
  processParseResult: (result, context) => {
    if (!result.success) return result;
    // 严格模式下核心解析已做 /1000，此处不再重复换算
    if (context?.strict) return result;
    const value = Big(result.value).div(1000).toNumber();
    return { ...result, value };
  },
};

/**
 * **后处理插件**
 * 负责在结果后添加 ‰ 符号。
 */
const perMilleSymbolAppender: FormatPlugin = {
  name: 'per-mille-symbol-appender',
  version: '2.0.0',
  description: '为千分比结果添加“‰”符号',
  priority: 100,
  phase: 'post-process',
  isApplicable: (context: PluginExecutionContext | ParseExecutionContext) =>
    context.style === PER_MILLE_STYLE,
  processResult: (formattedValue, parts) => ({
    formattedValue: `${formattedValue}‰`,
    parts: [...parts, { type: 'literal', value: '‰' }],
  }),
};

/**
 * **千分比插件组**
 * 将两个协同工作的插件打包成一个逻辑单元，便于统一注册和管理。
 */
export const perMillePluginGroup: PluginGroup = {
  name: PER_MILLE_STYLE,
  plugins: [perMilleValueProcessor, perMilleSymbolAppender],
};
