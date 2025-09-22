/**
 * @file 存放所有运行时校验规则
 */

import type { ValidationRule } from './types';

/**
 * 校验规则集合
 * @description 每一条规则定义了如何验证、报错和（在生产环境中）修复一个配置问题。
 */
export const validationRules: ValidationRule[] = [
  {
    key: 'fractionDigits',
    isValid: (opts) =>
      opts.minimumFractionDigits === undefined ||
      opts.maximumFractionDigits === undefined ||
      opts.minimumFractionDigits <= opts.maximumFractionDigits,
    errorMessage: (opts) =>
      `'minimumFractionDigits' (${opts.minimumFractionDigits}) 不能大于 'maximumFractionDigits' (${opts.maximumFractionDigits}).`,
    fix: (opts) => ({
      ...opts,
      // 静默修复：将最大值设为与最小值相等
      maximumFractionDigits: opts.minimumFractionDigits,
    }),
  },

  {
    key: 'significantDigits',
    isValid: (opts) =>
      opts.minimumSignificantDigits === undefined ||
      opts.maximumSignificantDigits === undefined ||
      opts.minimumSignificantDigits <= opts.maximumSignificantDigits,
    errorMessage: (opts) =>
      `'minimumSignificantDigits' (${opts.minimumSignificantDigits}) 不能大于 'maximumSignificantDigits' (${opts.maximumSignificantDigits}).`,
    fix: (opts) => ({
      ...opts,
      // 静默修复：将最大值设为与最小值相等
      maximumSignificantDigits: opts.minimumSignificantDigits,
    }),
  },

  {
    key: 'significantAndFractionConflict',
    isValid: (opts) =>
      !(opts.maximumSignificantDigits !== undefined && opts.maximumFractionDigits !== undefined),
    errorMessage: () =>
      `'maximumSignificantDigits' 和 'maximumFractionDigits' 等小数位配置不能同时使用.`,
    fix: (opts) => {
      // 静默修复：优先保留 significantDigits, 移除所有 fractionDigits 相关属性
      const result = { ...opts };
      delete result.minimumFractionDigits;
      delete result.maximumFractionDigits;
      delete result.minimumIntegerDigits;
      // Note: maximumIntegerDigits is not a valid Intl.NumberFormatOptions property
      // The valid property is minimumIntegerDigits
      delete result.minimumIntegerDigits;
      return result;
    },
  },
];
