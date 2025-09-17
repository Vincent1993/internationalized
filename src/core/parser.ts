/**
 * @file 数字解析器
 * @description 将格式化后的字符串解析回数字，参考 Adobe React Spectrum 的实现模式
 */

import Big from 'big.js';
import { getPluginRegistry } from '../plugins';
import type { ParseExecutionContext } from '../plugins/types';
import type { UseFormatOptions } from './types';

// ==================== 常量定义 ====================

/**
 * 支持的货币符号列表
 */
const currencySymbols = ['$', '€', '£', '¥', '￥', '₹', '₽', '₩', '₪', '₨'] as const;

/**
 * 支持的负号符号模式
 */
const negativePattern = /^[-−‒–—−](.*)$/;

/**
 * 货币代码模式（如 USD, EUR, CNY）
 */
const currencyCodePattern = {
  start: /^[A-Z]{3}\s*/,
  end: /\s*[A-Z]{3}$/,
} as const;

/**
 * 百分号模式
 */
const percentPattern = /%$/;

/**
 * 千分号模式
 */
const perMillePattern = /‰$/;

/**
 * 小数格式验证模式
 */
const decimalFormatPattern = /^\d*\.?\d*$/;

/**
 * 空白字符模式
 */
const whitespacePattern = /\s/g;

/**
 * 正则转义模式
 */
const regexEscapePattern = /[.*+?^${}()|[\]\\]/g;

/**
 * 特殊数值映射
 */
const specialValues = {
  infinity: ['∞', 'infinity'] as readonly string[],
  negativeInfinity: ['-∞', '-infinity'] as readonly string[],
  empty: ['n/a', '-', '--', '---'] as readonly string[],
} as const;

/**
 * 数值运算常量
 */
const mathConstants = {
  PERCENT_DIVISOR: '100',
  PER_MILLE_DIVISOR: '1000',
  ZERO: '0',
} as const;

function decorateParseResult(result: ParseResult): ParseResult {
  const value = result.value;
  const mathSign = Number.isNaN(value) ? NaN : Math.sign(value);
  const isNegativeZero = Object.is(value, -0);
  const isZero = value === 0 || isNegativeZero;
  const isPositive = value > 0;
  const isNegative = value < 0 || isNegativeZero;
  const isInteger = Number.isInteger(value);

  return {
    ...result,
    mathSign,
    isZero,
    isNegativeZero,
    isPositive,
    isNegative,
    isInteger,
  };
}

/**
 * 解析结果接口
 */
export interface ParseResult {
  /** 解析后的数字值，解析失败时为 NaN */
  value: number;
  /** 是否解析成功 */
  success: boolean;
  /** 原始输入字符串 */
  input: string;
  /** 错误信息，解析成功时为 null */
  error: string | null;
  /** Math.sign 的解析结果，NaN 表示无法确定 */
  mathSign: number;
  /** 是否为零（包含 -0） */
  isZero: boolean;
  /** 是否为负零 */
  isNegativeZero: boolean;
  /** 是否为正数（不包含 -0） */
  isPositive: boolean;
  /** 是否为负数（包含 -0） */
  isNegative: boolean;
  /** 是否为整数 */
  isInteger: boolean;
}

/**
 * 解析器配置选项
 */
export interface ParseOptions
  extends Pick<UseFormatOptions, 'locale' | 'style' | 'currency' | 'notation'> {
  /** 是否严格模式，严格模式下格式必须完全匹配 */
  strict?: boolean;
  /** 自定义千分位分隔符 */
  groupSeparator?: string;
  /** 自定义小数分隔符 */
  decimalSeparator?: string;
}

/**
 * 数字解析器类
 */
export class NumberParser {
  private options: Required<ParseOptions>;

  private formatter: Intl.NumberFormat;

  constructor(options: ParseOptions = {}) {
    const locale = Array.isArray(options.locale) ? options.locale[0] : options.locale;

    this.options = {
      locale: locale || 'en-US',
      style: options.style || 'decimal',
      currency: options.currency || 'USD',
      notation: options.notation || 'standard',
      strict: options.strict ?? false,
      groupSeparator: options.groupSeparator || this.getGroupSeparator(locale),
      decimalSeparator: options.decimalSeparator || this.getDecimalSeparator(locale),
    };

    // 创建格式化器（用于获取分隔符等信息）
    // per-mille 不是标准的 Intl.NumberFormat 样式，所以我们使用 decimal 作为回退
    const formatterStyle = this.options.style === 'per-mille' ? 'decimal' : this.options.style;

    this.formatter = new Intl.NumberFormat(this.options.locale, {
      style: formatterStyle,
      currency: this.options.currency,
      notation: this.options.notation,
    });
  }

  /**
   * 解析格式化后的数字字符串
   */
  parse(input: string): ParseResult {
    const result: ParseResult = {
      value: NaN,
      success: false,
      input,
      error: null,
      mathSign: Number.NaN,
      isZero: false,
      isNegativeZero: false,
      isPositive: false,
      isNegative: false,
      isInteger: false,
    };

    // 输入验证
    if (typeof input !== 'string') {
      result.error = 'Input must be a string';
      return decorateParseResult(result);
    }

    const trimmed = input.trim();
    // 解析插件：pre-parse 阶段
    const parseContext: ParseExecutionContext = {
      originalInput: trimmed,
      style: this.options.style,
      options: { notation: this.options.notation, style: this.options.style as any },
      strict: this.options.strict,
    };
    const pluginRegistry = getPluginRegistry();
    const preParsePlugins = pluginRegistry.getPluginsForPhase('pre-parse', parseContext);
    const normalizedInput = preParsePlugins.reduce((acc, plugin) => {
      try {
        return plugin.processParseInput ? plugin.processParseInput(acc, parseContext) : acc;
      } catch {
        return acc;
      }
    }, trimmed);
    if (trimmed === '') {
      result.error = 'Input is empty';
      return decorateParseResult(result);
    }

    try {
      // 预处理：处理特殊值
      const specialValue = this.parseSpecialValues(normalizedInput);
      if (specialValue !== null) {
        result.value = specialValue;
        result.success = true;
        return decorateParseResult(result);
      }

      // 根据样式解析
      const parsed = this.parseByStyle(normalizedInput);
      result.value = parsed;
      result.success = Number.isFinite(parsed);

      if (!result.success && !Number.isNaN(parsed)) {
        result.error = 'Parsed value is not finite';
      } else if (!result.success) {
        result.error = 'Failed to parse number from input';
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown parsing error';
    }

    // 解析插件：post-parse 阶段
    const postParsePlugins = pluginRegistry.getPluginsForPhase('post-parse', parseContext);
    const finalResult = postParsePlugins.reduce((acc, plugin) => {
      try {
        return plugin.processParseResult ? plugin.processParseResult(acc, parseContext) : acc;
      } catch {
        return acc;
      }
    }, result);

    return decorateParseResult(finalResult);
  }

  /**
   * 解析特殊数值
   */
  private parseSpecialValues(input: string): number | null {
    const lower = input.toLowerCase();

    // 处理无穷大
    if (specialValues.infinity.includes(lower)) {
      return Infinity;
    }

    // 处理负无穷大
    if (specialValues.negativeInfinity.includes(lower)) {
      return -Infinity;
    }

    // 处理空值表示
    if (specialValues.empty.includes(lower)) {
      return NaN;
    }

    // 注意：我们不在这里处理 'nan' 字符串，因为测试期望它解析失败
    // 而不是返回 NaN 值

    return null;
  }

  /**
   * 根据样式解析数字
   */
  private parseByStyle(input: string): number {
    // 首先检查 notation 类型
    if (this.options.notation === 'compact') {
      return this.parseCompactNotation(input);
    }
    if (this.options.notation === 'scientific' || this.options.notation === 'engineering') {
      return this.parseScientificNotation(input);
    }

    // 然后处理 style
    switch (this.options.style) {
      case 'percent':
        return this.parsePercent(input);
      case 'currency':
        return this.parseCurrency(input);
      case 'per-mille':
        return this.parsePerMille(input);
      case 'decimal':
      default:
        return this.parseDecimal(input);
    }
  }

  /**
   * 解析小数格式
   */
  private parseDecimal(input: string): number {
    let cleaned = input;

    // 处理负号（支持多种负号符号）
    const negativeMatch = cleaned.match(negativePattern);
    const isNegative = !!negativeMatch;
    if (isNegative) {
      [, cleaned] = negativeMatch;
    }

    // 移除所有空白字符
    cleaned = cleaned.replace(whitespacePattern, '');

    // 移除分组分隔符（需要转义特殊字符）
    const escapedGroupSeparator = this.escapeRegex(this.options.groupSeparator);
    cleaned = cleaned.replace(new RegExp(escapedGroupSeparator, 'g'), '');

    // 替换小数分隔符为标准点号
    if (this.options.decimalSeparator !== '.') {
      const escapedDecimalSeparator = this.escapeRegex(this.options.decimalSeparator);
      cleaned = cleaned.replace(new RegExp(escapedDecimalSeparator), '.');
    }

    // 验证清理后的字符串只包含数字和最多一个小数点
    if (!decimalFormatPattern.test(cleaned)) {
      throw new Error(`Invalid decimal format: "${cleaned}"`);
    }

    // 处理空字符串或只有小数点的情况
    if (cleaned === '' || cleaned === '.') {
      return 0;
    }

    try {
      // 使用 Big.js 进行精确计算
      const bigNumber = new Big(cleaned);
      const result = bigNumber.toNumber();

      if (Number.isNaN(result)) {
        throw new Error(`Failed to parse decimal: "${cleaned}"`);
      }

      return isNegative ? -result : result;
    } catch (error) {
      throw new Error(`Failed to parse decimal: "${cleaned}"`);
    }
  }

  /**
   * 解析百分比格式
   */
  private parsePercent(input: string): number {
    // 移除百分号
    const withoutPercent = input.replace(percentPattern, '').trim();

    if (input === withoutPercent) {
      // 没有百分号，可能是纯数字
      if (!this.options.strict) {
        return this.parseDecimal(withoutPercent);
      }
      throw new Error('Percent symbol (%) is required');
    }

    const decimal = this.parseDecimal(withoutPercent);

    try {
      // 使用 Big.js 进行精确除法计算
      const bigDecimal = new Big(decimal);
      const bigResult = bigDecimal.div(mathConstants.PERCENT_DIVISOR);
      return bigResult.toNumber();
    } catch (error) {
      throw new Error('Failed to calculate percentage');
    }
  }

  /**
   * 解析千分比格式
   */
  private parsePerMille(input: string): number {
    // 移除千分号
    const withoutPerMille = input.replace(perMillePattern, '').trim();

    if (input === withoutPerMille) {
      // 没有千分号
      if (!this.options.strict) {
        return this.parseDecimal(withoutPerMille);
      }
      throw new Error('Per-mille symbol (‰) is required');
    }

    const decimal = this.parseDecimal(withoutPerMille);

    try {
      // 使用 Big.js 进行精确除法计算
      const bigDecimal = new Big(decimal);
      const bigResult = bigDecimal.div(mathConstants.PER_MILLE_DIVISOR);
      return bigResult.toNumber();
    } catch (error) {
      throw new Error('Failed to calculate per-mille');
    }
  }

  /**
   * 解析紧凑格式
   */
  private parseCompactNotation(input: string): number {
    const trimmed = input.trim();

    // 紧凑格式单位映射
    const compactUnits: Record<string, number> = {
      // 英文单位（大小写敏感）
      K: 1e3,
      k: 1e3,
      M: 1e6,
      m: 1e6,
      G: 1e9,
      g: 1e9,
      T: 1e12,
      t: 1e12,
      P: 1e15,
      p: 1e15,
      E: 1e18,
      e: 1e18,
      Z: 1e21,
      z: 1e21,
      Y: 1e24,
      y: 1e24,
      // 中文单位
      万: 1e4,
      千: 1e3,
      百: 1e2,
      十: 1e1,
      // 英文全称
      thousand: 1e3,
      million: 1e6,
      billion: 1e9,
      trillion: 1e12,
    };

    // 匹配数字和单位
    const match = trimmed.match(/^([-+]?\d*\.?\d+)\s*([A-Za-z万千百十]+)?$/);

    if (!match) {
      // 如果没有匹配到单位，回退到标准解析
      return this.parseDecimal(trimmed);
    }

    const [, numberPart, unit] = match;

    if (!unit) {
      // 没有单位，回退到标准解析
      return this.parseDecimal(trimmed);
    }

    const multiplier = compactUnits[unit];
    if (multiplier === undefined) {
      throw new Error(`Unknown compact unit: ${unit}`);
    }

    // 先解析基础数字部分
    const baseNumber = this.parseDecimal(numberPart);
    const result = baseNumber * multiplier;

    if (!Number.isFinite(result)) {
      throw new Error('Resulting value is not finite');
    }

    return result;
  }

  /**
   * 解析科学记数法格式
   */
  private parseScientificNotation(input: string): number {
    const trimmed = input.trim();

    // 匹配科学记数法格式：1.23E+03, 1.23E-03, 1.23E3
    const match = trimmed.match(/^([-+]?\d*\.?\d+)[Ee]([-+]?\d+)$/);

    if (!match) {
      throw new Error('Invalid scientific notation format');
    }

    const [, numberPart, exponentPart] = match;

    // 先解析基础数字部分
    const baseNumber = this.parseDecimal(numberPart);
    const exponent = parseInt(exponentPart, 10);

    if (isNaN(exponent)) {
      throw new Error('Invalid exponent in scientific notation');
    }

    const result = baseNumber * 10 ** exponent;

    if (!Number.isFinite(result)) {
      throw new Error('Resulting number is not finite');
    }

    return result;
  }

  /**
   * 解析货币格式
   */
  private parseCurrency(input: string): number {
    let cleaned = input;

    // 移除常见的货币符号（使用 reduce 避免 for...of）
    cleaned = currencySymbols.reduce((acc: string, symbol: string) => {
      const escapedSymbol = this.escapeRegex(symbol);
      return acc.replace(new RegExp(escapedSymbol, 'g'), '');
    }, cleaned);

    // 移除常见的货币代码（如 USD, EUR, CNY 等）
    cleaned = cleaned.replace(currencyCodePattern.start, '').replace(currencyCodePattern.end, '');

    // 移除额外的空格
    cleaned = cleaned.trim();

    if (!this.options.strict && input === cleaned) {
      // 没有货币符号，允许解析纯数字
      return this.parseDecimal(cleaned);
    }

    return this.parseDecimal(cleaned);
  }

  /**
   * 正则表达式转义辅助方法
   */
  private escapeRegex(text: string): string {
    return text.replace(regexEscapePattern, '\\$&');
  }

  /**
   * 获取货币符号
   */
  private getCurrencySymbol(): string {
    try {
      // 使用格式化器获取货币符号
      const parts = this.formatter.formatToParts(1);
      const currencyPart = parts.find((part) => part.type === 'currency');
      return currencyPart?.value || '$';
    } catch {
      return '$';
    }
  }

  /**
   * 获取分组分隔符
   */
  private getGroupSeparator(locale?: string): string {
    try {
      const formatter = new Intl.NumberFormat(locale);
      const parts = formatter.formatToParts(1234);
      const groupPart = parts.find((part) => part.type === 'group');
      return groupPart?.value || ',';
    } catch {
      return ',';
    }
  }

  /**
   * 获取小数分隔符
   */
  private getDecimalSeparator(locale?: string): string {
    try {
      const formatter = new Intl.NumberFormat(locale);
      const parts = formatter.formatToParts(1.2);
      const decimalPart = parts.find((part) => part.type === 'decimal');
      return decimalPart?.value || '.';
    } catch {
      return '.';
    }
  }

  /**
   * 获取当前解析器选项
   */
  getOptions(): Required<ParseOptions> {
    return { ...this.options };
  }

  /**
   * 更新解析器选项
   */
  updateOptions(options: Partial<ParseOptions>): void {
    this.options = { ...this.options, ...options };

    // 处理 per-mille 样式的特殊情况
    const formatterStyle = this.options.style === 'per-mille' ? 'decimal' : this.options.style;

    this.formatter = new Intl.NumberFormat(this.options.locale, {
      style: formatterStyle,
      currency: this.options.currency,
      notation: this.options.notation,
    });
  }
}

/**
 * 创建数字解析器
 */
export function createNumberParser(options?: ParseOptions): NumberParser {
  return new NumberParser(options);
}

/**
 * 快速解析函数
 */
export function parseNumber(input: string, options?: ParseOptions): ParseResult {
  const parser = createNumberParser(options);
  return parser.parse(input);
}
