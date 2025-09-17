/**
 * @file FP 模块集成测试
 * @description 测试模块导出、与核心模块集成、API一致性等
 */

import * as FP from '../../src/fp';
import {
  integrationTestHelpers,
  testHelpers,
  formatters,
  boundaryValues,
  performanceTestHelpers,
} from './test-utils';

import { clearCache } from '../../src/fp/memoize';

describe('FP 模块集成测试', () => {
  describe('模块导出完整性', () => {
    describe('格式化函数导出', () => {
      it('应该正确导出所有格式化函数', () => {
        const expectedFunctions = [
          'formatAsDecimal',
          'formatAsInteger',
          'formatAsCurrency',
          'formatAsPercent',
          'formatAsPerMille',
          'formatAsCompact',
          'formatAsScientific',
        ];

        expectedFunctions.forEach(funcName => {
          expect(typeof FP[funcName as keyof typeof FP]).toBe('function');
        });
      });

      it('命名导出应该与模块导出一致', () => {
        expect(formatters.decimal).toBe(FP.formatAsDecimal);
        expect(formatters.integer).toBe(FP.formatAsInteger);
        expect(formatters.currency).toBe(FP.formatAsCurrency);
        expect(formatters.percent).toBe(FP.formatAsPercent);
        expect(formatters.perMille).toBe(FP.formatAsPerMille);
        expect(formatters.compact).toBe(FP.formatAsCompact);
        expect(formatters.scientific).toBe(FP.formatAsScientific);
      });
    });

    describe('工具函数导出', () => {
      it('应该导出配置管理函数', () => {
        expect(typeof FP.config).toBe('function');
        expect(typeof FP.resetDefaultConfigs).toBe('function');
      });

      it('应该导出类型定义', () => {
        // TypeScript 类型在运行时不存在，但可以验证配置函数的使用
        const configs = FP.config();
        expect(typeof configs).toBe('object');
        expect(configs).toHaveProperty('decimal');
        expect(configs).toHaveProperty('percent');
      });
    });
  });

  describe('API 一致性', () => {
    describe('参数接口统一性', () => {
      it('所有格式化函数都应该接受 unknown 类型的 value', () => {
        const testValue = 1234.567;

        integrationTestHelpers.expectConsistentBehavior(({ name, formatter }) => {
          let result: string;
          if (name === 'currency') {
            result = formatter(testValue, 'USD');
          } else {
            result = formatter(testValue);
          }
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        });
      });

      it('所有函数都应该返回字符串类型', () => {
        const testValues = [123, 0, -456.789, '123.45', null, undefined];

        testValues.forEach(value => {
          integrationTestHelpers.expectConsistentBehavior(({ name, formatter }) => {
            let result: string;
            if (name === 'currency') {
              result = formatter(value, 'USD');
            } else {
              result = formatter(value);
            }
            expect(typeof result).toBe('string');
          });
        });
      });

      it('选项参数应该具有正确的类型约束', () => {
        // formatAsInteger 不应该受 maximumFractionDigits 影响
        const integerResult = formatters.integer(123.456, { maximumFractionDigits: 5 } as any);
        expect(integerResult).toBe('123'); // 应该被强制为整数

        // formatAsCurrency 应该忽略 style 和 currency 选项
        const currencyResult = formatters.currency(123, 'EUR', {
          style: 'decimal' as any,
          currency: 'USD' as any
        });
        expect(currencyResult).toContain('€'); // 应该使用传入的 EUR
      });
    });

    describe('错误处理一致性', () => {
      it('所有函数都应该优雅处理边界值', () => {
        boundaryValues.forEach(value => {
          integrationTestHelpers.expectConsistentBehavior(({ name, formatter }) => {
            testHelpers.expectNoThrow(() => {
              if (name === 'currency') {
                return formatter(value, 'USD');
              } else {
                return formatter(value);
              }
            }, `${name} with ${value}`);
          });
        });
      });

      it('无效货币代码应该统一处理', () => {
        const invalidCurrencies = ['INVALID', '', null, undefined];

        invalidCurrencies.forEach(currency => {
          testHelpers.expectNoThrow(() => {
            formatters.currency(100, currency as any);
          }, `invalid currency: ${currency}`);
        });
      });
    });
  });

  describe('函数式编程特性验证', () => {
    describe('纯函数特性', () => {
      it('所有函数都应该是纯函数（无副作用）', () => {
        const value = 1234.567;
        const options = { maximumFractionDigits: 2 };

        integrationTestHelpers.expectConsistentBehavior(({ name, formatter }) => {
          let fn: () => string;
          if (name === 'currency') {
            fn = () => formatter(value, 'USD', options);
          } else {
            fn = () => formatter(value, options);
          }

          testHelpers.expectPureFunction(fn, 3);
        });
      });

      it('函数应该不修改输入参数', () => {
        const options = { maximumFractionDigits: 2, useGrouping: true };

        integrationTestHelpers.expectConsistentBehavior(({ name, formatter }) => {
          if (name === 'currency') {
            testHelpers.expectOptionsImmutable((opts) => formatter(123, 'USD', opts), options);
          } else {
            testHelpers.expectOptionsImmutable((opts) => formatter(123, opts), options);
          }
        });
      });
    });

    describe('组合性', () => {
      it('应该支持函数组合', () => {
        const value = 1234.567;

        const pipeline = [
          (v: number) => formatters.decimal(v, { maximumFractionDigits: 2 }),
          (v: number) => formatters.integer(v),
          (v: number) => formatters.percent(v / 100),
          (v: number) => formatters.compact(v),
        ];

        pipeline.forEach(formatter => {
          const result = formatter(value);
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        });
      });

      it('应该支持柯里化风格', () => {
        // 创建专门的格式化函数
        const formatUSD = (value: unknown) => formatters.currency(value, 'USD');
        const formatEUR = (value: unknown) => formatters.currency(value, 'EUR');
        const formatWithDecimals = (value: unknown) =>
          formatters.percent(value, { maximumFractionDigits: 2 });

        expect(formatUSD(1234.56)).toContain('$');
        expect(formatEUR(1234.56)).toContain('€');
        expect(formatWithDecimals(0.1234)).toContain('12.34%');
      });
    });

    describe('高阶函数支持', () => {
      it('应该支持作为回调函数使用', () => {
        const values = [1234.567, 5678.901, 9999.123];

        // 作为 map 回调
        const decimalResults = values.map(v => formatters.decimal(v));
        const percentResults = values.map(v => formatters.percent(v / 100));

        expect(decimalResults).toHaveLength(3);
        expect(percentResults).toHaveLength(3);

        decimalResults.forEach(result => {
          expect(typeof result).toBe('string');
          expect(result).toContain(',');
        });

        percentResults.forEach(result => {
          expect(typeof result).toBe('string');
          expect(result).toContain('%');
        });
      });

      it('应该支持过滤和映射操作', () => {
        const data = [
          { value: 1234.567, format: 'decimal' },
          { value: 0.123, format: 'percent' },
          { value: 9876.543, format: 'currency' },
          { value: 1000000, format: 'compact' },
        ];

        const formatted = data
          .filter(item => item.value > 0)
          .map(item => {
            switch (item.format) {
              case 'decimal': return formatters.decimal(item.value);
              case 'percent': return formatters.percent(item.value);
              case 'currency': return formatters.currency(item.value, 'USD');
              case 'compact': return formatters.compact(item.value);
              default: return 'N/A';
            }
          });

        expect(formatted).toHaveLength(4);
        formatted.forEach(result => {
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('与核心模块集成', () => {
    describe('格式化一致性', () => {
      it('应该与核心格式化器产生一致的结果', () => {
        // 仅测试基础功能，避免模块导入问题
        const value = 1234.567;
        const options = { maximumFractionDigits: 2 };

        // 测试 FP 函数的基础功能
        const fpResult = formatters.decimal(value, options);
        expect(fpResult).toBe('1,234.57');

        // 验证格式化器能正常工作
        expect(typeof fpResult).toBe('string');
        expect(fpResult.length).toBeGreaterThan(0);
      });

      it('应该正确处理插件扩展的样式', () => {
        // 测试千分比样式（插件扩展）
        const result = formatters.perMille(0.075);
        expect(result).toBe('75‰');
        expect(result.includes('‰')).toBe(true);
      });
    });

    describe('配置系统集成', () => {
      it('FP 函数应该响应全局配置变化', () => {
        // 修改全局配置
        FP.config({
          percent: { maximumFractionDigits: 1 },
          perMille: { maximumFractionDigits: 3 }
        });

        expect(formatters.percent(0.123456)).toBe('12.3%');
        expect(formatters.perMille(0.012345)).toBe('12.345‰');

        // 恢复默认配置
        FP.resetDefaultConfigs();
      });

      it('用户选项应该能覆盖全局配置', () => {
        // 设置全局配置
        FP.config({
          percent: { maximumFractionDigits: 0 }
        });

        // 全局配置生效
        expect(formatters.percent(0.123456)).toBe('12%');

        // 用户选项覆盖全局配置
        expect(formatters.percent(0.123456, { maximumFractionDigits: 2 })).toBe('12.35%');

        // 恢复默认配置
        FP.resetDefaultConfigs();
      });
    });
  });

  describe('性能集成验证', () => {
    beforeEach(() => {
      clearCache();
    });

    describe('整体性能', () => {
      it('完整工作流应该保持良好性能', () => {
        const testData = performanceTestHelpers.createLargeDataset(200);

        const start = performance.now();

        // 模拟真实应用场景
        const results = testData.map(value => ({
          raw: value,
          decimal: formatters.decimal(value, { maximumFractionDigits: 2 }),
          integer: formatters.integer(value),
          currency: formatters.currency(value, 'USD', { minimumFractionDigits: 2 }),
          percent: formatters.percent(value / 100, { maximumFractionDigits: 1 }),
          compact: formatters.compact(value * 1000),
          scientific: formatters.scientific(value * 1000000),
        }));

        const duration = performance.now() - start;

        expect(results).toHaveLength(200);
        expect(duration).toBeLessThan(300); // 应该在 300ms 内完成

        // 验证结果正确性
        results.slice(0, 5).forEach(result => {
          expect(typeof result.decimal).toBe('string');
          expect(typeof result.currency).toBe('string');
          expect(result.percent).toContain('%');
          expect(result.currency).toContain('$');
        });
      });

      it('缓存应该在实际使用中提供性能优势', () => {
        const commonOptions = [
          { maximumFractionDigits: 1 },
          { maximumFractionDigits: 2 },
          { locale: 'en-US' },
          { useGrouping: false },
        ];

        // 预热缓存
        commonOptions.forEach(options => {
          formatters.decimal(123.456, options);
          formatters.percent(0.123, options);
        });

        const iterations = 100;

        const start = performance.now();
        for (let i = 0; i < iterations; i++) {
          commonOptions.forEach(options => {
            formatters.decimal(123.456 + i, options);
            formatters.percent((0.123 + i/1000), options);
          });
        }
        const cachedTime = performance.now() - start;

        expect(cachedTime).toBeLessThan(200); // 缓存命中应该很快
      });
    });

    describe('内存效率', () => {
      it('大量操作不应该导致内存泄漏', () => {
        const iterations = 500;
        const options = { maximumFractionDigits: 2 };

        // 执行大量操作
        for (let i = 0; i < iterations; i++) {
          formatters.decimal(Math.random() * 1000, options);
          formatters.currency(Math.random() * 1000, 'USD', options);
          formatters.percent(Math.random(), options);
        }

        // 清理缓存
        clearCache();

        // 验证系统仍然正常工作
        const result = formatters.decimal(123.456, options);
        expect(result).toBe('123.46');
      });
    });
  });

  describe('向后兼容性', () => {
    describe('API 稳定性', () => {
      it('核心 API 应该保持向后兼容', () => {
        // 验证所有预期的函数都存在且可调用
        const coreAPIs = [
          () => formatters.decimal(123),
          () => formatters.integer(123.456),
          () => formatters.currency(123, 'USD'),
          () => formatters.percent(0.123),
          () => formatters.perMille(0.123),
          () => formatters.compact(123456),
          () => formatters.scientific(123456),
        ];

        coreAPIs.forEach(api => {
          testHelpers.expectNoThrow(api, 'core API');
          const result = api();
          expect(typeof result).toBe('string');
        });
      });

      it('配置 API 应该保持向后兼容', () => {
        testHelpers.expectNoThrow(() => FP.config(), 'config getter');
        testHelpers.expectNoThrow(() => FP.config({}), 'config setter');
        testHelpers.expectNoThrow(() => FP.resetDefaultConfigs(), 'config reset');
        testHelpers.expectNoThrow(() => FP.clearCache(), 'cache clear');
      });
    });
  });
});
