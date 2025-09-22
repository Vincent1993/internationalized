/**
 * @file 核心状态检测工具
 */

import type { InputValueState } from '../../plugins/types';
import { VALUE_STATE, SPECIAL_INVALID_INDICATOR_VALUE } from './constants';

/**
 * 检测输入值的状态，并将其归一化为预定义的常量。
 *
 * @param value - 需要检测的原始输入值。
 * @returns {InputValueState} - 表示值状态的常量。
 */
export function detectValueState(value: unknown): InputValueState {
  if (value === null) return VALUE_STATE.NULL;
  if (value === undefined) return VALUE_STATE.UNDEFINED;

  // 检查空数组
  if (Array.isArray(value) && value.length === 0) return VALUE_STATE.NULL;

  if (typeof value === 'string') {
    const lowerCaseValue = value.toLowerCase();
    if (SPECIAL_INVALID_INDICATOR_VALUE.includes(value)) {
      if (lowerCaseValue === 'nan') return VALUE_STATE.NAN;
      if (lowerCaseValue === 'infinity') return VALUE_STATE.INFINITY;
      return VALUE_STATE.NULL;
    }
  }

  const numValue = Number(value);
  if (Number.isNaN(numValue)) return VALUE_STATE.NAN;
  if (numValue === Infinity) return VALUE_STATE.INFINITY;
  if (numValue === -Infinity) return VALUE_STATE.NEGATIVE_INFINITY;

  return VALUE_STATE.VALID;
}
