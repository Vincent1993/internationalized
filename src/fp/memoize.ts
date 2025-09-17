import type { UseFormatOptions, NumberFormatter } from '../core/types';
import type { ParseOptions } from '../core/parser';
import { NumberParser } from '../core/parser';
import { createNumberFormat } from '../core/formatter';
import { createCacheKey } from '../utils/cache-key';

interface CacheItem<T> {
  value: T;
  timestamp: number;
}

interface SimpleCache<T> {
  get: (key: string) => T | undefined;
  set: (key: string, value: T) => void;
  clear: () => void;
  size: () => number;
}

function createSimpleCache<T>(maxSize = 200): SimpleCache<T> {
  const cache = new Map<string, CacheItem<T>>();

  return {
    get(key: string): T | undefined {
      const item = cache.get(key);
      return item?.value;
    },

    set(key: string, value: T): void {
      if (cache.size >= maxSize) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey !== undefined) {
          cache.delete(oldestKey);
        }
      }
      cache.set(key, { value, timestamp: Date.now() });
    },

    clear(): void {
      cache.clear();
    },

    size(): number {
      return cache.size;
    },
  };
}

// =============================================================================
// 专用缓存实例
// =============================================================================

const formatterCache = createSimpleCache<NumberFormatter>(200);
const parserCache = createSimpleCache<NumberParser>(200);
const DEFAULT_FORMATTER_CACHE_KEY = '__default__';

export function getMemoizedFormatter(options: UseFormatOptions = {}): NumberFormatter {
  const isEmptyOptions = !options || Object.keys(options).length === 0;

  const key = (() => {
    if (isEmptyOptions) {
      return DEFAULT_FORMATTER_CACHE_KEY;
    }

    const baseOptions: Record<string, unknown> = {
      locale: options.locale ?? 'zh-CN',
      style: options.style ?? 'decimal',
      useGrouping: options.useGrouping ?? true,
    };

    const remainingEntries = Object.entries(options as Record<string, unknown>)
      .filter(([key]) => key !== 'locale' && key !== 'style' && key !== 'useGrouping')
      .reduce<Record<string, unknown>>((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

    const normalizedOptions = {
      ...baseOptions,
      ...remainingEntries,
    };

    return createCacheKey(normalizedOptions, { skipUndefined: true });
  })();

  let formatter = formatterCache.get(key);

  if (!formatter) {
    formatter = createNumberFormat(options);
    formatterCache.set(key, formatter);
  }

  return formatter;
}

export function getMemoizedParser(options: ParseOptions = {}): NumberParser {
  const normalizedOptions = {
    locale: options.locale ?? 'zh-CN',
    style: options.style ?? 'decimal',
    currency: options.currency ?? 'CNY',
    notation: options.notation ?? 'standard',
    strict: options.strict ?? false,
    groupSeparator: options.groupSeparator ?? ',',
    decimalSeparator: options.decimalSeparator ?? '.',
  };

  const key = createCacheKey(normalizedOptions);
  let parser = parserCache.get(key);

  if (!parser) {
    parser = new NumberParser(options);
    parserCache.set(key, parser);
  }

  return parser;
}

// 缓存管理 API
export function clearAllFPCaches(): void {
  formatterCache.clear();
  parserCache.clear();
}

export function getFPCacheStats(): {
  formatter: { size: number; maxSize: number };
  parser: { size: number; maxSize: number };
} {
  return {
    formatter: {
      size: formatterCache.size(),
      maxSize: 200,
    },
    parser: {
      size: parserCache.size(),
      maxSize: 200,
    },
  };
}

// Convenience APIs (保持向后兼容)
export function clearFormatterCache(): void {
  formatterCache.clear();
}

export function clearParserCache(): void {
  parserCache.clear();
}

export function clearCache(): void {
  clearAllFPCaches();
}
