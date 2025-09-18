/**
 * @file 中文大写数字转换插件
 * @description 为数字格式化提供中文大写数字展示，以及解析辅助。
 */

import Big from 'big.js';
import type {
  FormatPlugin,
  PluginExecutionContext,
  ParseExecutionContext,
  PluginGroup,
} from '../types';

const CN_UPPER_STYLE = 'cn-upper';
const NEGATIVE_SIGN = '负';
const DECIMAL_POINT = '点';

const DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'] as const;
const SMALL_UNITS = ['', '拾', '佰', '仟'] as const;
const LARGE_UNITS = ['', '万', '亿', '兆'] as const;
const SMALL_UNIT_MAP: Record<string, number> = {
  拾: 10,
  佰: 100,
  仟: 1000,
};
const LARGE_UNIT_MAP: Record<string, Big> = {
  兆: new Big('1000000000000'),
  亿: new Big('100000000'),
  万: new Big('10000'),
};
const DIGIT_MAP: Record<string, number> = {
  零: 0,
  壹: 1,
  贰: 2,
  叁: 3,
  肆: 4,
  伍: 5,
  陆: 6,
  柒: 7,
  捌: 8,
  玖: 9,
};

function chunkString(value: string, size: number): string[] {
  const result: string[] = [];
  for (let i = value.length; i > 0; i -= size) {
    const start = Math.max(i - size, 0);
    result.unshift(value.slice(start, i));
  }
  return result;
}

function convertFourDigitGroup(group: string): string {
  const digits = group.padStart(4, '0').split('');
  let result = '';
  let zeroCount = 0;
  digits.forEach((digitChar, index) => {
    const digit = Number(digitChar);
    const unit = SMALL_UNITS[digits.length - index - 1];
    if (digit === 0) {
      zeroCount += 1;
    } else {
      if (zeroCount > 0 && result) {
        result += DIGITS[0];
      }
      zeroCount = 0;
      result += `${DIGITS[digit]}${unit}`;
    }
  });
  return result;
}

function convertIntegerToChinese(intStr: string): string {
  if (!intStr || /^0+$/.test(intStr)) {
    return DIGITS[0];
  }
  const groups = chunkString(intStr, 4);
  let result = '';
  let zeroPending = false;
  groups.forEach((group, index) => {
    const converted = convertFourDigitGroup(group);
    const largeUnit = LARGE_UNITS[groups.length - index - 1];
    if (converted) {
      if (zeroPending && result) {
        result += DIGITS[0];
      }
      result += converted + largeUnit;
      zeroPending = false;
    } else {
      zeroPending = !!result;
    }
  });
  return result || DIGITS[0];
}

function convertDecimalToChinese(decimalStr?: string): string {
  if (!decimalStr) return '';
  return decimalStr
    .split('')
    .map((char) => {
      const digit = Number(char);
      if (Number.isNaN(digit)) {
        throw new Error(`Invalid decimal digit: ${char}`);
      }
      return DIGITS[digit];
    })
    .join('');
}

function toChineseUppercase(value: number): string {
  if (!Number.isFinite(value)) {
    return '非数字';
  }
  const bigValue = new Big(value);
  const isNegative = bigValue.lt(0);
  const absValue = bigValue.abs();
  const normalized = absValue.toFixed();
  const [integerPartRaw, decimalPart] = normalized.split('.');
  const integerPart = convertIntegerToChinese(integerPartRaw);
  const decimalPartUpper = convertDecimalToChinese(decimalPart);
  const formatted = decimalPartUpper ? `${integerPart}${DECIMAL_POINT}${decimalPartUpper}` : integerPart;
  return isNegative ? `${NEGATIVE_SIGN}${formatted}` : formatted;
}

function parseFourDigitGroup(segment: string): Big {
  if (!segment) {
    return new Big(0);
  }
  let total = 0;
  let currentDigit = -1;
  for (let i = 0; i < segment.length; i += 1) {
    const char = segment[i];
    if (char === DIGITS[0]) {
      currentDigit = 0;
      continue;
    }
    if (char in DIGIT_MAP) {
      currentDigit = DIGIT_MAP[char];
      if (i === segment.length - 1) {
        total += currentDigit;
        currentDigit = -1;
      }
      continue;
    }
    if (char in SMALL_UNIT_MAP) {
      const unitValue = SMALL_UNIT_MAP[char];
      const digit = currentDigit > 0 ? currentDigit : 1;
      total += digit * unitValue;
      currentDigit = -1;
      continue;
    }
    throw new Error(`无法解析的中文大写数字: ${char}`);
  }
  return new Big(total);
}

function parseChineseInteger(input: string): Big {
  if (!input || input === DIGITS[0]) {
    return new Big(0);
  }
  let remaining = input;
  let total = new Big(0);
  (['兆', '亿', '万'] as const).forEach((unit) => {
    const index = remaining.indexOf(unit);
    if (index !== -1) {
      const before = remaining.slice(0, index);
      const after = remaining.slice(index + 1);
      const beforeValue = parseChineseInteger(before);
      total = total.plus(beforeValue.times(LARGE_UNIT_MAP[unit]));
      remaining = after;
    }
  });
  if (remaining) {
    total = total.plus(parseFourDigitGroup(remaining));
  }
  return total;
}

function parseChineseUppercaseToNumberString(input: string): string {
  let trimmed = input.trim();
  if (trimmed === '') {
    return trimmed;
  }
  let negative = false;
  if (trimmed.startsWith(NEGATIVE_SIGN)) {
    negative = true;
    trimmed = trimmed.slice(1);
  }
  if (trimmed === DIGITS[0]) {
    return negative ? '-0' : '0';
  }
  const [integerPart, decimalPart] = trimmed.split(DECIMAL_POINT);
  const integerValue = parseChineseInteger(integerPart);
  let numericString = integerValue.toString();
  if (decimalPart) {
    const decimalDigits = decimalPart
      .split('')
      .map((char) => {
        if (!(char in DIGIT_MAP)) {
          throw new Error(`无法解析的中文大写数字: ${char}`);
        }
        return DIGIT_MAP[char];
      })
      .join('');
    if (decimalDigits.length > 0) {
      numericString += `.${decimalDigits}`;
    }
  }
  if (negative && numericString !== '0') {
    numericString = `-${numericString}`;
  }
  return numericString;
}

const cnUppercaseOptionsNormalizer: FormatPlugin = {
  name: 'cn-upper-options-normalizer',
  version: '1.0.0',
  description: '调整中文大写数字格式的基础选项',
  priority: 100,
  phase: 'pre-process',
  isApplicable: (context: PluginExecutionContext | ParseExecutionContext) =>
    context.style === CN_UPPER_STYLE,
  processOptions: (options: Intl.NumberFormatOptions) => {
    const { style, ...rest } = options;
    return { ...rest, style: 'decimal' };
  },
};

const cnUppercaseFormatter: FormatPlugin = {
  name: 'cn-upper-formatter',
  version: '1.0.0',
  description: '将数字格式化为中文大写数字',
  priority: 10,
  phase: 'format',
  isApplicable: (context: PluginExecutionContext | ParseExecutionContext) =>
    context.style === CN_UPPER_STYLE,
  processResult: (_formattedValue, _parts, context) => {
    if (context.valueState && context.valueState !== 'valid') {
      return { formattedValue: _formattedValue, parts: _parts };
    }
    const result = toChineseUppercase(context.currentValue);
    return {
      formattedValue: result,
      parts: [{ type: 'literal', value: result }],
    };
  },
};

const cnUppercaseParseNormalizer: FormatPlugin = {
  name: 'cn-upper-parse-normalizer',
  version: '1.0.0',
  description: '在解析前将中文大写数字转换为阿拉伯数字字符串',
  priority: 100,
  phase: 'pre-parse',
  isApplicable: (context: PluginExecutionContext | ParseExecutionContext) =>
    context.style === CN_UPPER_STYLE,
  processParseInput: (input: string) => {
    return parseChineseUppercaseToNumberString(input);
  },
};

export const chineseUppercasePluginGroup: PluginGroup = {
  name: CN_UPPER_STYLE,
  plugins: [cnUppercaseOptionsNormalizer, cnUppercaseFormatter, cnUppercaseParseNormalizer],
};

export { toChineseUppercase };
