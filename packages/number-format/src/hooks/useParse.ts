/**
 * @file 数字解析 Hook
 * @description 提供数字解析功能的 React Hook
 */

import { useMemo } from 'react';
import { NumberParser, type ParseOptions, type ParseResult } from '../core/parser';
import { useNumberFormatContext } from '../core/context';
import type { UseFormatOptions } from '../core/types';

/**
 * 解析 Hook 选项
 */
export interface UseParseOptions extends ParseOptions {
  /** 继承的格式化选项 */
  formatOptions?: UseFormatOptions;
}

/**
 * 解析 Hook 返回结果
 */
export interface UseParseResult {
  /** 解析函数 */
  parse: (input: string) => ParseResult;
  /** 解析器实例 */
  parser: NumberParser;
  /** 当前解析选项 */
  options: Required<ParseOptions>;
}

/**
 * @name useParse
 * @description 提供数字解析能力的 React Hook，会复用上下文的 locale、style 等配置。
 *
 * @since 0.0.1
 *
 * @param options - 解析选项
 * @returns 包含 `parse` 函数与解析器实例的对象
 *
 * @example
 * ```tsx
 * function InputForm() {
 *   const { parse } = useParse({
 *     style: 'currency',
 *     currency: 'USD'
 *   });
 *
 *   const [value, setValue] = useState('');
 *
 *   const handleChange = (input: string) => {
 *     const result = parse(input);
 *     if (result.success) {
 *       setValue(result.value.toString());
 *     }
 *   };
 *
 *   return <input onChange={(e) => handleChange(e.target.value)} />;
 * }
 * ```
 */
export function useParse(options: UseParseOptions = {}): UseParseResult {
  const context = useNumberFormatContext();

  // 合并上下文选项和传入选项
  const mergedOptions = useMemo(() => {
    const contextOptions = context || {};
    const formatOptions = options.formatOptions || {};

    return {
      locale: options.locale || formatOptions.locale || contextOptions.locale,
      style: options.style || formatOptions.style || contextOptions.style,
      currency: options.currency || formatOptions.currency || contextOptions.currency,
      notation: options.notation || formatOptions.notation || contextOptions.notation,
      strict: options.strict,
      groupSeparator: options.groupSeparator,
      decimalSeparator: options.decimalSeparator,
    };
  }, [options, context]);

  // 创建解析器实例
  const parser = useMemo(() => {
    return new NumberParser(mergedOptions);
  }, [mergedOptions]);

  // 解析函数
  const parse = useMemo(() => {
    return (input: string): ParseResult => parser.parse(input);
  }, [parser]);

  // 返回完整的解析选项
  const finalOptions = useMemo((): Required<ParseOptions> => {
    // 从解析器中获取实际使用的选项
    return parser.getOptions();
  }, [parser]);

  return {
    parse,
    parser,
    options: finalOptions,
  };
}
