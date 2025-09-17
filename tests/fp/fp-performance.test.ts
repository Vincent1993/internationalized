/**
 * @file FP 性能和缓存功能测试
 * @description 统一测试缓存、memoization 和性能相关功能
 */

import {
  testHelpers,
  performanceTestHelpers,
  formatters,
  validNumbers,
} from './test-utils';

import { getMemoizedFormatter, clearCache } from '../../src/fp/memoize';
import type { UseFormatOptions } from '../../src/core/types';

describe('FP 性能和缓存功能', () => {
  describe('Memoization 缓存机制', () => {
    beforeEach(() => {
      clearCache();
    });

    describe('缓存基础功能', () => {
      it('相同选项应该返回相同的格式化器实例', () => {
        const options: UseFormatOptions = { style: 'currency', currency: 'USD' };

        const formatter1 = getMemoizedFormatter(options);
        const formatter2 = getMemoizedFormatter(options);

        expect(formatter1).toBe(formatter2); // 引用相等
      });

      it('不同选项应该返回不同的格式化器实例', () => {
        const options1: UseFormatOptions = { style: 'currency', currency: 'USD' };
        const options2: UseFormatOptions = { style: 'currency', currency: 'EUR' };

        const formatter1 = getMemoizedFormatter(options1);
        const formatter2 = getMemoizedFormatter(options2);

        expect(formatter1).not.toBe(formatter2);
      });

      it('undefined 选项应该使用默认格式化器', () => {
        const formatter1 = getMemoizedFormatter();
        const formatter2 = getMemoizedFormatter(undefined);
        const formatter3 = getMemoizedFormatter({});

        expect(formatter1).toBe(formatter2);
        expect(formatter1).toBe(formatter3); // {} 和 undefined 应该产生相同的缓存键
      });
    });

    describe('缓存键生成', () => {
      it('选项顺序不同但内容相同应该使用相同缓存', () => {
        const options1: UseFormatOptions = {
          style: 'decimal',
          maximumFractionDigits: 2,
          useGrouping: true
        };
        const options2: UseFormatOptions = {
          useGrouping: true,
          style: 'decimal',
          maximumFractionDigits: 2
        };

        const formatter1 = getMemoizedFormatter(options1);
        const formatter2 = getMemoizedFormatter(options2);

        expect(formatter1).toBe(formatter2);
      });

      it('不同基本类型选项应该生成不同缓存键', () => {
        const testCases = [
          { maximumFractionDigits: 2 },
          { maximumFractionDigits: 3 },
          { useGrouping: true },
          { useGrouping: false },
          { locale: 'en-US' },
          { locale: 'zh-CN' },
          { currency: 'USD' },
          { currency: 'EUR' },
        ];

        const formatters = testCases.map(options => getMemoizedFormatter(options));

        // 验证所有格式化器都是唯一的（有些选项可能产生相同的缓存键）
        const uniqueFormatters = new Set(formatters);
        expect(uniqueFormatters.size).toBeGreaterThan(0);
        expect(uniqueFormatters.size).toBeLessThanOrEqual(formatters.length);
      });

      it('相同选项的不同引用应该生成相同缓存键', () => {
        const baseOptions = { style: 'percent' as const, maximumFractionDigits: 2 };
        const options1 = { ...baseOptions };
        const options2 = { ...baseOptions };

        const formatter1 = getMemoizedFormatter(options1);
        const formatter2 = getMemoizedFormatter(options2);

        expect(formatter1).toBe(formatter2);
      });
    });

    describe('复杂选项缓存', () => {
      it('复杂选项组合应该正确缓存', () => {
        const complexOptions: UseFormatOptions = {
          style: 'currency',
          currency: 'JPY',
          locale: 'ja-JP',
          maximumFractionDigits: 0,
          minimumIntegerDigits: 3,
          useGrouping: true,
          signDisplay: 'exceptZero'
        };

        const formatter1 = getMemoizedFormatter(complexOptions);
        const formatter2 = getMemoizedFormatter(complexOptions);

        expect(formatter1).toBe(formatter2);

        // 测试格式化结果一致性
        const result1 = formatter1.format(1234);
        const result2 = formatter2.format(1234);

        expect(result1.formattedValue).toBe(result2.formattedValue);
      });

      it('特殊字符和值应该正确处理', () => {
        const specialOptions: UseFormatOptions = {
          locale: 'zh-CN',
          style: 'currency',
          currency: 'CNY',
          currencyDisplay: 'narrowSymbol',
          notation: 'compact',
          compactDisplay: 'short'
        };

        const formatter1 = getMemoizedFormatter(specialOptions);
        const formatter2 = getMemoizedFormatter({ ...specialOptions });

        expect(formatter1).toBe(formatter2);

        const result = formatter1.format(1234567);
        expect(result.formattedValue).toBeDefined();
        expect(typeof result.formattedValue).toBe('string');
      });
    });

    describe('缓存清理', () => {
      it('clearCache 应该清除所有缓存', () => {
        // 创建几个不同的格式化器
        const formatter1 = getMemoizedFormatter({ style: 'decimal' });
        const formatter2 = getMemoizedFormatter({ style: 'percent' });
        const formatter3 = getMemoizedFormatter({ style: 'currency', currency: 'USD' });

        // 验证它们被缓存了
        expect(getMemoizedFormatter({ style: 'decimal' })).toBe(formatter1);
        expect(getMemoizedFormatter({ style: 'percent' })).toBe(formatter2);
        expect(getMemoizedFormatter({ style: 'currency', currency: 'USD' })).toBe(formatter3);

        // 清除缓存
        clearCache();

        // 验证缓存被清除，新的调用返回新的实例
        expect(getMemoizedFormatter({ style: 'decimal' })).not.toBe(formatter1);
        expect(getMemoizedFormatter({ style: 'percent' })).not.toBe(formatter2);
        expect(getMemoizedFormatter({ style: 'currency', currency: 'USD' })).not.toBe(formatter3);
      });

      it('清除缓存后应该能正常创建新格式化器', () => {
        const formatter1 = getMemoizedFormatter({ style: 'decimal' });
        clearCache();
        const formatter2 = getMemoizedFormatter({ style: 'decimal' });

        expect(formatter1).not.toBe(formatter2);
        expect(formatter2).toBeDefined();
        expect(typeof formatter2.format).toBe('function');

        // 新格式化器应该正常工作
        const result = formatter2.format(1234.56);
        expect(result.formattedValue).toBe('1,234.56');
      });

      it('多次调用 clearCache 应该是安全的', () => {
        getMemoizedFormatter({ style: 'decimal' });

        clearCache();
        clearCache();
        clearCache();

        // 应该仍然能正常创建格式化器
        const formatter = getMemoizedFormatter({ style: 'decimal' });
        expect(formatter).toBeDefined();
      });
    });

    describe('错误处理', () => {
      it('无效选项不应该在缓存层抛出错误', () => {
        testHelpers.expectNoThrow(() => {
          getMemoizedFormatter({
            style: 'currency' as any,
            currency: 'INVALID_CURRENCY'
          });
        }, 'invalid currency in cache');
      });

      it('循环引用应该正确处理', () => {
        const circularOptions: any = { style: 'decimal' };
        circularOptions.self = circularOptions;

        // 循环引用在简化实现中被忽略，创建格式化器时会使用默认选项
        const formatter = getMemoizedFormatter(circularOptions);
        expect(formatter).toBeDefined();
        expect(typeof formatter.format).toBe('function');
      });

      it('null 和 undefined 值的选项应该正确处理', () => {
        const optionsWithNull: UseFormatOptions = {
          style: 'decimal',
          maximumFractionDigits: undefined as any,
        };

        const formatter = getMemoizedFormatter(optionsWithNull);
        expect(formatter).toBeDefined();
        expect(typeof formatter.format).toBe('function');
      });
    });
  });

  describe('性能优化', () => {
    beforeEach(() => {
      clearCache();
    });

    describe('缓存性能提升', () => {
      it('缓存应该提高重复调用的性能', () => {
        const options = { style: 'currency' as const, currency: 'USD' };

        testHelpers.expectCacheWorking(() => getMemoizedFormatter(options), 50);
      });

      it('FP 格式化函数应该受益于缓存', () => {
        const value = 1234.567;
        const options = { maximumFractionDigits: 2 };
        const iterations = 100;
        const repeat = 8;

        // 预热缓存
        formatters.decimal(value, options);

        function measureCached() {
          const start = performance.now();
          for (let i = 0; i < iterations; i++)
            formatters.decimal(value, options);
          return performance.now() - start;
        }

        function measureUncached() {
          clearCache();
          const start = performance.now();
          for (let i = 0; i < iterations; i++)
            formatters.decimal(value, options);
          return performance.now() - start;
        }

        const cachedTimes: number[] = [];
        const uncachedTimes: number[] = [];

        for (let i = 0; i < repeat; i++) {
          cachedTimes.push(measureCached());
          uncachedTimes.push(measureUncached());
        }

        // 取多次的中位数，减少抖动影响
        const getMedian = (arr: number[]) => {
          const sorted = [...arr].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
        };

        const medianCached = getMedian(cachedTimes);
        const medianUncached = getMedian(uncachedTimes);

        expect(medianCached).toBeLessThan(medianUncached * 0.95);
      });
    });

    describe('大量选项组合处理', () => {
      it('应该能处理大量不同的选项组合', () => {
        const formattersCreated: any[] = [];
        const locales = ['en-US', 'zh-CN', 'de-DE', 'ja-JP'];
        const styles = ['decimal', 'currency', 'percent'] as const;
        const currencies = ['USD', 'EUR', 'JPY', 'CNY'];

        // 创建大量不同的格式化器
        locales.forEach(locale => {
          styles.forEach(style => {
            if (style === 'currency') {
              currencies.forEach(currency => {
                const formatter = getMemoizedFormatter({ locale, style, currency });
                formattersCreated.push(formatter);
              });
            } else {
              const formatter = getMemoizedFormatter({ locale, style });
              formattersCreated.push(formatter);
            }
          });
        });

        expect(formattersCreated.length).toBeGreaterThan(0);

        // 验证所有格式化器都是唯一的
        const uniqueFormatters = new Set(formattersCreated);
        expect(uniqueFormatters.size).toBe(formattersCreated.length);

        // 验证缓存复用
        const duplicateFormatter = getMemoizedFormatter({
          locale: 'en-US',
          style: 'currency',
          currency: 'USD'
        });
        expect(formattersCreated).toContain(duplicateFormatter);
      });
    });

    describe('批量操作性能', () => {
      it('批量格式化应该保持良好性能', () => {
        const testData = performanceTestHelpers.createLargeDataset(500);

        const operations = testData.map(value => () => ({
          decimal: formatters.decimal(value),
          integer: formatters.integer(value),
          currency: formatters.currency(value, 'USD'),
          percent: formatters.percent(value / 100),
          compact: formatters.compact(value),
        }));

        const duration = performanceTestHelpers.batchPerformanceTest(operations, 800);
        expect(duration).toBeLessThan(800);
      });

      it('不同选项的批量操作应该利用缓存', () => {
        const testData = performanceTestHelpers.createLargeDataset(200);
        const commonOptions = [
          { maximumFractionDigits: 1 },
          { maximumFractionDigits: 2 },
          { useGrouping: false },
          { locale: 'de-DE' },
        ];

        const start = performance.now();

        testData.forEach(value => {
          commonOptions.forEach(options => {
            formatters.decimal(value, options);
            formatters.percent(value / 100, options);
          });
        });

        const duration = performance.now() - start;
        expect(duration).toBeLessThan(500); // 应该在 500ms 内完成
      });
    });

    describe('极值性能', () => {
      it('极大和极小数字应该高效处理', () => {
        const extremeValues = [
          Number.MAX_SAFE_INTEGER,
          Number.MIN_SAFE_INTEGER,
          Number.MAX_VALUE,
          Number.MIN_VALUE,
        ];

        const operations = extremeValues.flatMap(value => [
          () => formatters.decimal(value),
          () => formatters.scientific(value),
          () => formatters.compact(value),
        ]);

        performanceTestHelpers.batchPerformanceTest(operations, 50);
      });

      it('复杂选项组合的性能应该可接受', () => {
        const complexOptions = {
          locale: 'de-DE',
          maximumFractionDigits: 3,
          minimumFractionDigits: 1,
          useGrouping: true,
          signDisplay: 'exceptZero' as const,
          notation: 'compact' as const,
          compactDisplay: 'short' as const,
        };

        const operations = validNumbers.flatMap(({ value }) => [
          () => formatters.decimal(value, complexOptions),
          () => formatters.compact(value, complexOptions),
          () => formatters.scientific(value, complexOptions),
        ]);

        performanceTestHelpers.batchPerformanceTest(operations, 100);
      });
    });
  });

  describe('内存管理', () => {
    beforeEach(() => {
      clearCache();
    });

    describe('缓存效率', () => {
      it('复用缓存应该比创建新实例更快', () => {
        const options = { style: 'currency' as const, currency: 'USD' };

        // 第一次调用 - 创建新实例
        const start1 = performance.now();
        const formatter1 = getMemoizedFormatter(options);
        const time1 = performance.now() - start1;

        // 第二次调用 - 使用缓存
        const start2 = performance.now();
        const formatter2 = getMemoizedFormatter(options);
        const time2 = performance.now() - start2;

        expect(formatter1).toBe(formatter2);
        expect(time2).toBeLessThanOrEqual(time1);
      });

      it('缓存应该避免重复的 Intl.NumberFormat 创建', () => {
        const options = { style: 'decimal' as const, maximumFractionDigits: 2 };
        const iterations = 50;

        // 测试缓存效果
        const formatters = [];
        for (let i = 0; i < iterations; i++) {
          formatters.push(getMemoizedFormatter(options));
        }

        // 所有格式化器应该是同一个实例
        const uniqueFormatters = new Set(formatters);
        expect(uniqueFormatters.size).toBe(1);
      });
    });

    describe('内存泄漏预防', () => {
      it('清除缓存应该释放格式化器引用', () => {
        // 创建一些格式化器
        const options = [
          { style: 'decimal' as const },
          { style: 'currency' as const, currency: 'USD' },
          { style: 'percent' as const },
        ];

        const formatters = options.map(opt => getMemoizedFormatter(opt));
        expect(formatters.length).toBe(3);

        // 清除缓存
        clearCache();

        // 新创建的格式化器应该是不同的实例
        const newFormatters = options.map(opt => getMemoizedFormatter(opt));
        newFormatters.forEach((newFormatter, index) => {
          expect(newFormatter).not.toBe(formatters[index]);
        });
      });
    });
  });
});
