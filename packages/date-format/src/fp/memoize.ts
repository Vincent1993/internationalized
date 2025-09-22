import { createSimpleCache } from '@internationalized/shared';
import { createDateFormatter } from '../core/formatter';
import type { DateFormatter, UseDateFormatOptions } from '../core/types';

const formatterCache = createSimpleCache<DateFormatter>({ maxSize: 100 });
const DEFAULT_CACHE_KEY = '__default__';
const MAX_CACHE_SIZE = 100;

function normalizeValue(value: unknown): unknown {
  if (value == null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    const normalizedEntries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => [key, normalizeValue(val)]);
    return Object.fromEntries(normalizedEntries);
  }

  return value;
}

function createCacheKey(options: UseDateFormatOptions = {}): string {
  const meaningfulEntries = Object.entries(options).filter(([, val]) => val !== undefined);

  if (meaningfulEntries.length === 0) {
    return DEFAULT_CACHE_KEY;
  }

  const normalized = meaningfulEntries
    .map(([key, value]) => [key, normalizeValue(value)])
    .sort(([a], [b]) => a.localeCompare(b));

  return JSON.stringify(normalized);
}

/**
 * @description 获取带缓存的日期格式化器实例。
 */
export function getMemoizedFormatter(options: UseDateFormatOptions = {}): DateFormatter {
  const key = createCacheKey(options);
  const cached = formatterCache.get(key);

  if (cached) {
    return cached;
  }

  const formatter = createDateFormatter(options);
  formatterCache.set(key, formatter);

  // 通过一次示例调用预热格式化器，避免首次调用时的延迟。
  try {
    formatter.format(Date.now());
  } catch {
    // 忽略预热异常，真实调用会再次触发并返回标准化结果。
  }

  return formatter;
}

/**
 * @description 清理所有 FP 级别的缓存。
 */
export function clearAllFPCaches(): void {
  formatterCache.clear();
}

/**
 * @description 提供调试用的缓存统计信息。
 */
export function getFPCacheStats(): { formatter: { size: number; maxSize: number } } {
  return {
    formatter: {
      size: formatterCache.size(),
      maxSize: MAX_CACHE_SIZE,
    },
  };
}

/**
 * @description 兼容旧接口的缓存清理函数。
 */
export function clearFormatterCache(): void {
  clearAllFPCaches();
}
