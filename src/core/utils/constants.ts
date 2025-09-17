/**
 * @file 核心常量
 * @description 定义了整个格式化引擎中可以复用的常量。
 */

/**
 * 定义了 `detectValueState` 函数可能返回的各种输入值状态。
 */
export const VALUE_STATE = {
  NULL: 'null',
  UNDEFINED: 'undefined',
  NAN: 'nan',
  INFINITY: 'infinity',
  NEGATIVE_INFINITY: 'negative-infinity',
  VALID: 'valid',
} as const;

/**
 * 定义了一组特殊的字符串值，这些值应被视作无效的数值输入。
 */
export const SPECIAL_INVALID_INDICATOR_VALUE: readonly string[] = [
  '',
  '-',
  '--',
  'NULL',
  'NaN',
  'Infinity',
  '',
];
