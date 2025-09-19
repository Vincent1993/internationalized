import Big from 'big.js';
import type { FormatPlugin, ParseExecutionContext, PluginExecutionContext, PluginGroup } from '../types';
import type { RatioPluginConfig } from './constants';
import { RATIO_PARSE_ERROR_PREFIX } from './constants';

function trimInput(input: string): string {
  return input.trim();
}

export function createRatioPluginGroup(config: RatioPluginConfig): PluginGroup {
  const { style, multiplier, symbol, suffixPattern, strictErrorMessage, valueDescription, symbolDescription } = config;

  const valueProcessor: FormatPlugin = {
    name: `${style}-value-processor`,
    version: '2.1.0',
    description: valueDescription,
    priority: 100,
    phase: 'pre-process',
    isApplicable: (context: PluginExecutionContext | ParseExecutionContext) => context.style === style,
    processValue: (value: number) => Big(value).mul(multiplier).toNumber(),
    processOptions: (options: Intl.NumberFormatOptions) => {
      const { style: _, ...rest } = options;
      return { ...rest, style: 'decimal' };
    },
  };

  const parseNormalizer: FormatPlugin = {
    name: `${style}-parse-normalizer`,
    version: '2.1.0',
    description: '归一化比例类样式的解析输入',
    priority: 90,
    phase: 'pre-parse',
    isApplicable: (context: PluginExecutionContext | ParseExecutionContext) => context.style === style,
    processParseInput: (input: string, context?: ParseExecutionContext) => {
      const trimmed = trimInput(input);
      const hasSuffix = suffixPattern.test(trimmed);

      if (context?.strict && !hasSuffix) {
        return `${RATIO_PARSE_ERROR_PREFIX}${strictErrorMessage}`;
      }

      if (!hasSuffix) {
        return trimmed;
      }

      return trimInput(trimmed.replace(suffixPattern, ''));
    },
  };

  const parseAdjuster: FormatPlugin = {
    name: `${style}-parse-adjuster`,
    version: '2.1.0',
    description: '解析后对比例结果进行缩放',
    priority: 110,
    phase: 'post-parse',
    isApplicable: (context: PluginExecutionContext | ParseExecutionContext) => context.style === style,
    processParseResult: (result) => {
      if (!result.success) {
        return result;
      }

      const value = Big(result.value).div(multiplier).toNumber();
      return { ...result, value };
    },
  };

  const symbolAppender: FormatPlugin = {
    name: `${style}-symbol-appender`,
    version: '2.1.0',
    description: symbolDescription,
    priority: 150,
    phase: 'post-process',
    isApplicable: (context: PluginExecutionContext | ParseExecutionContext) => context.style === style,
    processResult: (formattedValue, parts) => ({
      formattedValue: `${formattedValue}${symbol}`,
      parts: [...parts, { type: 'literal', value: symbol }],
    }),
  };

  return {
    name: style,
    plugins: [valueProcessor, parseNormalizer, parseAdjuster, symbolAppender],
  };
}
