/**
 * @file FP 解析函数
 * @description 函数式编程风格的数字解析函数
 */

import { parseNumber, type ParseOptions, type ParseResult } from '../core/parser';

/**
 * 通用解析函数，使用默认配置并强制覆盖指定的选项
 * @param input 要解析的字符串
 * @param userOptions 用户提供的选项
 * @param forcedOptions 强制覆盖的选项
 * @returns 解析结果
 */
function parseWithDefaults(
  input: string,
  userOptions: ParseOptions | undefined,
  forcedOptions: ParseOptions,
): ParseResult {
  const finalOptions = {
    ...userOptions,
    ...forcedOptions,
  };

  return parseNumber(input, finalOptions);
}

/**
 * 解析小数格式的字符串
 * @param input 格式化后的小数字符串，如 "1,234.56"
 * @param options 解析选项
 * @returns 解析结果
 *
 * @example
 * ```ts
 * parseDecimal("1,234.56");        // => { value: 1234.56, success: true, ... }
 * parseDecimal("1.234,56", { locale: 'de-DE' }); // => { value: 1234.56, success: true, ... }
 * parseDecimal("invalid");         // => { value: NaN, success: false, error: "..." }
 * ```
 */
export function parseDecimal(input: string, options?: ParseOptions): ParseResult {
  return parseWithDefaults(input, options, { style: 'decimal' });
}

/**
 * 解析整数格式的字符串
 * @param input 格式化后的整数字符串，如 "1,234"
 * @param options 解析选项
 * @returns 解析结果
 *
 * @example
 * ```ts
 * parseInteger("1,234");           // => { value: 1234, success: true, ... }
 * parseInteger("1,234.56");        // => { value: 1234.56, success: true, ... }
 * ```
 */
export function parseInteger(input: string, options?: ParseOptions): ParseResult {
  return parseWithDefaults(input, options, { style: 'decimal' });
}

/**
 * 解析货币格式的字符串
 * @param input 格式化后的货币字符串，如 "$1,234.56"
 * @param currency 货币代码
 * @param options 解析选项
 * @returns 解析结果
 *
 * @example
 * ```ts
 * parseCurrency("$1,234.56", "USD");       // => { value: 1234.56, success: true, ... }
 * parseCurrency("€1.234,56", "EUR");       // => { value: 1234.56, success: true, ... }
 * parseCurrency("¥1,235", "JPY");          // => { value: 1235, success: true, ... }
 * parseCurrency("invalid", "USD");         // => { value: NaN, success: false, error: "..." }
 * ```
 */
export function parseCurrency(
  input: string,
  currency: string,
  options?: Omit<ParseOptions, 'style' | 'currency'>,
): ParseResult {
  return parseWithDefaults(input, options, { style: 'currency', currency });
}

/**
 * 解析百分比格式的字符串
 * @param input 格式化后的百分比字符串，如 "12.34%"
 * @param options 解析选项
 * @returns 解析结果
 *
 * @example
 * ```ts
 * parsePercent("12.34%");          // => { value: 0.1234, success: true, ... }
 * parsePercent("87.65%");          // => { value: 0.8765, success: true, ... }
 * parsePercent("12.34");           // => { value: 0.1234, success: true, ... } (非严格模式)
 * parsePercent("invalid%");        // => { value: NaN, success: false, error: "..." }
 * ```
 */
export function parsePercent(input: string, options?: Omit<ParseOptions, 'style'>): ParseResult {
  return parseWithDefaults(input, options, { style: 'percent' });
}

/**
 * 解析千分比格式的字符串
 * @param input 格式化后的千分比字符串，如 "123.4‰"
 * @param options 解析选项
 * @returns 解析结果
 *
 * @example
 * ```ts
 * parsePerMille("123.4‰");         // => { value: 0.1234, success: true, ... }
 * parsePerMille("500‰");           // => { value: 0.5, success: true, ... }
 * parsePerMille("123.4");          // => { value: 0.1234, success: true, ... } (非严格模式)
 * parsePerMille("invalid‰");       // => { value: NaN, success: false, error: "..." }
 * ```
 */
export function parsePerMille(input: string, options?: Omit<ParseOptions, 'style'>): ParseResult {
  return parseWithDefaults(input, options, { style: 'per-mille' });
}

/**
 * 解析万分位格式的字符串
 */
export function parsePerMyriad(input: string, options?: Omit<ParseOptions, 'style'>): ParseResult {
  return parseWithDefaults(input, options, { style: 'per-myriad' });
}

/**
 * 解析百分点格式的字符串
 */
export function parsePercentPoint(
  input: string,
  options?: Omit<ParseOptions, 'style'>,
): ParseResult {
  return parseWithDefaults(input, options, { style: 'percent-point' });
}

/**
 * 解析紧凑格式的字符串
 * @param input 格式化后的紧凑字符串，如 "1.2M", "1.2万"
 * @param options 解析选项
 * @returns 解析结果
 *
 * @example
 * ```ts
 * parseCompact("1.2M");            // => { value: 1200000, success: true, ... }
 * parseCompact("1.2万");           // => { value: 12000, success: true, ... }
 * parseCompact("1,234");           // => { value: 1234, success: true, ... }
 * ```
 */
export function parseCompact(
  input: string,
  options?: Omit<ParseOptions, 'style' | 'notation'>,
): ParseResult {
  return parseWithDefaults(input, options, { style: 'decimal', notation: 'compact' });
}

/**
 * 解析科学记数法格式的字符串
 * @param input 格式化后的科学记数法字符串，如 "1.234E3"
 * @param options 解析选项
 * @returns 解析结果
 *
 * @example
 * ```ts
 * parseScientific("1.234E3");      // => { value: 1234, success: true, ... }
 * parseScientific("1.23E-4");      // => { value: 0.000123, success: true, ... }
 * parseScientific("invalid");      // => { value: NaN, success: false, error: "..." }
 * ```
 */
export function parseScientific(
  input: string,
  options?: Omit<ParseOptions, 'style' | 'notation'>,
): ParseResult {
  return parseWithDefaults(input, options, { style: 'decimal', notation: 'scientific' });
}

/**
 * 通用解析函数，自动检测格式类型
 * @param input 格式化后的字符串
 * @param options 解析选项
 * @returns 解析结果
 *
 * @example
 * ```ts
 * parseAuto("$1,234.56");          // 自动识别为货币格式
 * parseAuto("12.34%");             // 自动识别为百分比格式
 * parseAuto("123‰");               // 自动识别为千分比格式
 * parseAuto("1.23E3");             // 自动识别为科学记数法
 * ```
 */
export function parseAuto(input: string, options?: ParseOptions): ParseResult {
  const trimmed = input.trim();

  // 检测格式类型
  if (trimmed.includes('%')) {
    return parsePercent(trimmed, options);
  }

  if (trimmed.includes('‱')) {
    return parsePerMyriad(trimmed, options);
  }

  if (trimmed.includes('‰')) {
    return parsePerMille(trimmed, options);
  }

  if (/(个?百分点|個?百分點|pp)$/iu.test(trimmed)) {
    return parsePercentPoint(trimmed, options);
  }

  if (/[E][+-]?\d+$/i.test(trimmed)) {
    return parseScientific(trimmed, options);
  }

  // 检测货币符号
  if (/^[\$€£¥￥]|[\$€£¥￥]$/.test(trimmed) || /^[A-Z]{3}\s*/.test(trimmed)) {
    // 需要推断货币类型，这里默认使用选项中的货币或 USD
    const currency = options?.currency || 'USD';
    return parseCurrency(trimmed, currency, options);
  }

  // 检测紧凑格式（包含字母单位）
  if (/\d+\.?\d*[KMGTPEZY万千百十]/i.test(trimmed)) {
    return parseCompact(trimmed, options);
  }

  // 默认作为小数处理
  return parseDecimal(trimmed, options);
}
