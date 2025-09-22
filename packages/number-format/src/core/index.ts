/**
 * @file 核心功能公共 API
 */

// ==================== 核心 API ====================
export { NumberFormatProvider } from './context';
export { createNumberFormat, resolveFormatOptions } from './formatter';

// ==================== 核心类型 ====================
export type {
  MetricFormatRule,
  NumberFormatContextValue,
  UseFormatOptions,
  UseFormatResult,
  CreateNumberFormatOptions,
  NumberFormatter,
  ResolvedFormatOptions,
} from './types';
