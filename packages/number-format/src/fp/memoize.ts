import type { UseFormatOptions, NumberFormatter } from '../core/types';
import type { ParseOptions } from '../core/parser';
import { NumberParser } from '../core/parser';
import { createNumberFormat } from '../core/formatter';
import { createCacheKey } from '../utils/cache-key';
import { createSimpleCache } from '@internationalized/shared';

// =============================================================================
// 专用缓存实例
// =============================================================================

const formatterCache = createSimpleCache<NumberFormatter>({ maxSize: 200 });
const parserCache = createSimpleCache<NumberParser>({ maxSize: 200 });
const DEFAULT_FORMATTER_CACHE_KEY = '__default__';

export function getMemoizedFormatter(options: UseFormatOptions = {}): NumberFormatter {
  const isEmptyOptions = !options || Object.keys(options).length === 0;

  const key = (() => {
    if (isEmptyOptions) {
      return DEFAULT_FORMATTER_CACHE_KEY;
    }

    const {
      locale: providedLocale,
      style: providedStyle,
      useGrouping: providedUseGrouping,
      ...restOptions
    } = options;

    const normalizedOptions: UseFormatOptions = {
      ...restOptions,
      locale: providedLocale ?? 'zh-CN',
      style: providedStyle ?? 'decimal',
      useGrouping: providedUseGrouping ?? true,
    };

    const normalizedRecord: Record<string, unknown> = { ...normalizedOptions };

    return createCacheKey(normalizedRecord, { skipUndefined: true });
  })();

  let formatter = formatterCache.get(key);

  if (!formatter) {
    formatter = createNumberFormat(options);
    formatterCache.set(key, formatter);

    // 预热格式化器，确保首次创建时的昂贵成本发生在缓存写入阶段
    try {
      const warmupSamples = [0, 1, -1, 1234.56, -9876.54];
      for (let i = 0; i < 3; i++) {
        warmupSamples.forEach(sample => {
          formatter!.format(sample);
        });
      }
    } catch {
      // 忽略预热异常，实际调用时会按既定流程处理
    }
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
